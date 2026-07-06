using ClosedXML.Excel;
using HelpdeskApi.Data;
using HelpdeskApi.DTOs;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace HelpdeskApi.Services
{
    public interface IReportExportService
    {
        Task<byte[]> ExportMonthlyReportAsync(DateTime from, DateTime to, string format);
        Task<byte[]> ExportAgentPerformanceAsync(DateTime from, DateTime to, string format);
    }

    public class ReportExportService : IReportExportService
    {
        private readonly AppDbContext _dbContext;

        public ReportExportService(AppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<byte[]> ExportMonthlyReportAsync(DateTime from, DateTime to, string format)
        {
            from = DateTime.SpecifyKind(from, DateTimeKind.Utc);
            to = DateTime.SpecifyKind(to, DateTimeKind.Utc);

            var tickets = await _dbContext.Tickets
                .Include(t => t.Category)
                .Include(t => t.Priority)
                .Include(t => t.Status)
                .Include(t => t.CreatedByUser)
                .Where(t => t.CreatedAt >= from && t.CreatedAt <= to)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var totalTickets = tickets.Count;
            var resolved = tickets.Count(t => t.Status.Name == "Resolved" || t.Status.Name == "Closed");
            var openTickets = tickets.Count(t => t.Status.Name == "Open" || t.Status.Name == "In Progress" || t.Status.Name == "Pending");
            var resolutionRate = totalTickets > 0 ? (double)resolved / totalTickets * 100 : 0;

            if (format == "excel")
                return GenerateExcel(tickets, from, to, totalTickets, resolved, openTickets, resolutionRate);
            else
                return GeneratePdf(tickets, from, to, totalTickets, resolved, openTickets, resolutionRate);
        }

        public async Task<byte[]> ExportAgentPerformanceAsync(DateTime from, DateTime to, string format)
        {
            from = DateTime.SpecifyKind(from, DateTimeKind.Utc);
            to = DateTime.SpecifyKind(to, DateTimeKind.Utc);

            var agentRoleId = await _dbContext.Roles.Where(r => r.Name == "Agent").Select(r => r.Id).FirstOrDefaultAsync();
            var agents = await _dbContext.Users
                .Where(u => u.RoleId == agentRoleId && u.IsActive)
                .ToListAsync();

            var report = new List<AgentReportRow>();

            foreach (var agent in agents)
            {
                var assigned = await _dbContext.Tickets.CountAsync(t => t.AssignedTo == agent.Id && t.CreatedAt >= from && t.CreatedAt <= to);
                var resolved = await _dbContext.Tickets.CountAsync(t => t.AssignedTo == agent.Id && t.Status.Name == "Resolved" && t.CreatedAt >= from && t.CreatedAt <= to);

                report.Add(new AgentReportRow
                {
                    AgentName = agent.FullName,
                    Assigned = assigned,
                    Resolved = resolved,
                    ResolutionRate = assigned > 0 ? (double)resolved / assigned * 100 : 0
                });
            }

            report = report.OrderByDescending(r => r.Resolved).ToList();

            if (format == "excel")
                return GenerateAgentExcel(report, from, to);
            else
                return GenerateAgentPdf(report, from, to);
        }

        private byte[] GenerateExcel(List<Ticket> tickets, DateTime from, DateTime to, int total, int resolved, int open, double rate)
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Monthly Report");

            ws.Cell(1, 1).Value = "IT Help Desk - Monthly Report";
            ws.Cell(1, 1).Style.Font.Bold = true;
            ws.Cell(1, 1).Style.Font.FontSize = 14;
            ws.Cell(2, 1).Value = $"{from:yyyy-MM-dd} to {to:yyyy-MM-dd}";
            ws.Cell(2, 1).Style.Font.FontSize = 10;

            ws.Cell(4, 1).Value = "Summary";
            ws.Cell(4, 1).Style.Font.Bold = true;
            ws.Cell(5, 1).Value = "Total Tickets";
            ws.Cell(5, 2).Value = total;
            ws.Cell(6, 1).Value = "Resolved/Closed";
            ws.Cell(6, 2).Value = resolved;
            ws.Cell(7, 1).Value = "Open/In Progress/Pending";
            ws.Cell(7, 2).Value = open;
            ws.Cell(8, 1).Value = "Resolution Rate";
            ws.Cell(8, 2).Value = $"{rate:F1}%";

            ws.Cell(10, 1).Value = "Ticket Details";
            ws.Cell(10, 1).Style.Font.Bold = true;
            ws.Cell(11, 1).Value = "Ref #";
            ws.Cell(11, 2).Value = "Title";
            ws.Cell(11, 3).Value = "Category";
            ws.Cell(11, 4).Value = "Priority";
            ws.Cell(11, 5).Value = "Status";
            ws.Cell(11, 6).Value = "Created By";
            ws.Cell(11, 7).Value = "Created At";

            var headerRange = ws.Range(11, 1, 11, 7);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            for (var i = 0; i < tickets.Count; i++)
            {
                var t = tickets[i];
                var row = 12 + i;
                ws.Cell(row, 1).Value = t.ReferenceNumber;
                ws.Cell(row, 2).Value = t.Title;
                ws.Cell(row, 3).Value = t.Category.Name;
                ws.Cell(row, 4).Value = t.Priority.Name;
                ws.Cell(row, 5).Value = t.Status.Name;
                ws.Cell(row, 6).Value = t.CreatedByUser.FullName;
                ws.Cell(row, 7).Value = t.CreatedAt.ToString("yyyy-MM-dd HH:mm");
            }

            ws.Columns().AdjustToContents();
            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }

        private byte[] GeneratePdf(List<Ticket> tickets, DateTime from, DateTime to, int total, int resolved, int open, double rate)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.DefaultTextStyle(x => x.FontSize(10));
                    page.Size(PageSizes.A4);

                    page.Header().AlignCenter().Text("IT Help Desk - Monthly Report").Bold().FontSize(16);
                    page.Content().Column(col =>
                    {
                        col.Item().PaddingTop(10).Text($"{from:yyyy-MM-dd} to {to:yyyy-MM-dd}").FontSize(10);

                        col.Item().PaddingTop(10).Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn();
                                c.RelativeColumn();
                            });

                            table.Header(h =>
                            {
                                h.Cell().Text("Metric").Bold();
                                h.Cell().Text("Value").Bold();
                            });

                            table.Cell().Text("Total Tickets");
                            table.Cell().Text(total.ToString());
                            table.Cell().Text("Resolved/Closed");
                            table.Cell().Text(resolved.ToString());
                            table.Cell().Text("Open/In Progress/Pending");
                            table.Cell().Text(open.ToString());
                            table.Cell().Text("Resolution Rate");
                            table.Cell().Text($"{rate:F1}%");
                        });

                        col.Item().PaddingTop(10).Text("Ticket Details").Bold().FontSize(12);

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(2);
                                c.RelativeColumn(3);
                                c.RelativeColumn(2);
                                c.RelativeColumn(1);
                                c.RelativeColumn(1);
                                c.RelativeColumn(2);
                            });

                            table.Header(h =>
                            {
                                h.Cell().Text("Ref #").Bold();
                                h.Cell().Text("Title").Bold();
                                h.Cell().Text("Category").Bold();
                                h.Cell().Text("Priority").Bold();
                                h.Cell().Text("Status").Bold();
                                h.Cell().Text("Created At").Bold();
                            });

                            foreach (var t in tickets)
                            {
                                table.Cell().Text(t.ReferenceNumber);
                                table.Cell().Text(t.Title);
                                table.Cell().Text(t.Category.Name);
                                table.Cell().Text(t.Priority.Name);
                                table.Cell().Text(t.Status.Name);
                                table.Cell().Text(t.CreatedAt.ToString("yyyy-MM-dd"));
                            }
                        });
                    });

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Page ");
                        x.CurrentPageNumber();
                    });
                });
            }).GeneratePdf();
        }

        private byte[] GenerateAgentExcel(List<AgentReportRow> report, DateTime from, DateTime to)
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Agent Performance");

            ws.Cell(1, 1).Value = "Agent Performance Report";
            ws.Cell(1, 1).Style.Font.Bold = true;
            ws.Cell(1, 1).Style.Font.FontSize = 14;
            ws.Cell(2, 1).Value = $"{from:yyyy-MM-dd} to {to:yyyy-MM-dd}";

            ws.Cell(4, 1).Value = "Agent";
            ws.Cell(4, 2).Value = "Assigned";
            ws.Cell(4, 3).Value = "Resolved";
            ws.Cell(4, 4).Value = "Resolution Rate";

            var headerRange = ws.Range(4, 1, 4, 4);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            for (var i = 0; i < report.Count; i++)
            {
                var row = 5 + i;
                ws.Cell(row, 1).Value = report[i].AgentName;
                ws.Cell(row, 2).Value = report[i].Assigned;
                ws.Cell(row, 3).Value = report[i].Resolved;
                ws.Cell(row, 4).Value = $"{report[i].ResolutionRate:F1}%";
            }

            ws.Columns().AdjustToContents();
            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }

        private byte[] GenerateAgentPdf(List<AgentReportRow> report, DateTime from, DateTime to)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.DefaultTextStyle(x => x.FontSize(10));
                    page.Size(PageSizes.A4);

                    page.Header().AlignCenter().Text("Agent Performance Report").Bold().FontSize(16);
                    page.Content().Column(col =>
                    {
                        col.Item().PaddingTop(10).Text($"{from:yyyy-MM-dd} to {to:yyyy-MM-dd}").FontSize(10);

                        col.Item().PaddingTop(10).Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(3);
                                c.RelativeColumn(1);
                                c.RelativeColumn(1);
                                c.RelativeColumn(1);
                            });

                            table.Header(h =>
                            {
                                h.Cell().Text("Agent").Bold();
                                h.Cell().Text("Assigned").Bold();
                                h.Cell().Text("Resolved").Bold();
                                h.Cell().Text("Rate").Bold();
                            });

                            foreach (var r in report)
                            {
                                table.Cell().Text(r.AgentName);
                                table.Cell().Text(r.Assigned.ToString());
                                table.Cell().Text(r.Resolved.ToString());
                                table.Cell().Text($"{r.ResolutionRate:F1}%");
                            }
                        });
                    });
                });
            }).GeneratePdf();
        }

        private class AgentReportRow
        {
            public string AgentName { get; set; } = string.Empty;
            public int Assigned { get; set; }
            public int Resolved { get; set; }
            public double ResolutionRate { get; set; }
        }
    }
}
