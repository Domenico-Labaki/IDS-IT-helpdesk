using System.Security.Cryptography;
using System.Text;
using HelpdeskApi.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpdeskApi.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            if (await context.Roles.AnyAsync())
            {
                return;
            }

            var roles = new[]
            {
                new Role { Id = 1, Name = "Admin", Description = "Full system access" },
                new Role { Id = 2, Name = "Agent", Description = "IT support agent, manages and resolves tickets" },
                new Role { Id = 3, Name = "Manager", Description = "Monitors team tickets and reports" },
                new Role { Id = 4, Name = "Employee", Description = "Creates and tracks tickets" }
            };

            context.Roles.AddRange(roles);

            await context.SaveChangesAsync();
        }

        public static async Task SeedTestDataAsync(AppDbContext context)
        {
            if (await context.Users.AnyAsync(u => u.Email == "admin@test.com"))
                return;

            var passwordHash = BCrypt.Net.BCrypt.HashPassword("Test@1234", workFactor: 10);
            var baseDate = new DateTime(2026, 7, 5, 0, 0, 0, DateTimeKind.Utc);

            // =========================================================
            // USERS (18)
            // =========================================================
            var u1 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Alpha Admin",
                Email = "admin@test.com",
                PasswordHash = passwordHash,
                RoleId = 1,
                Department = "IT",
                IsActive = true,
                CreatedAt = baseDate.AddDays(-180),
                TokenVersion = 0
            };

            var u2 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Grace Admin",
                Email = "grace.admin@test.com",
                PasswordHash = passwordHash,
                RoleId = 1,
                Department = "IT",
                IsActive = true,
                CreatedBy = u1.Id,
                CreatedAt = baseDate.AddDays(-170),
                TokenVersion = 0
            };

            var u3 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Chloe Admin",
                Email = "chloe.admin@test.com",
                PasswordHash = passwordHash,
                RoleId = 1,
                Department = "IT",
                IsActive = false,
                CreatedBy = u1.Id,
                CreatedAt = baseDate.AddDays(-160),
                TokenVersion = 0
            };

            var u4 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Bob Agent",
                Email = "bob.agent@test.com",
                PasswordHash = passwordHash,
                RoleId = 2,
                Department = "IT Support",
                IsActive = true,
                CreatedBy = u1.Id,
                CreatedAt = baseDate.AddDays(-150),
                TokenVersion = 0
            };

            var u5 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Carol Agent",
                Email = "carol.agent@test.com",
                PasswordHash = passwordHash,
                RoleId = 2,
                Department = "IT Support",
                IsActive = true,
                CreatedBy = u1.Id,
                CreatedAt = baseDate.AddDays(-145),
                TokenVersion = 0
            };

            var u6 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Dave Agent",
                Email = "dave.agent@test.com",
                PasswordHash = passwordHash,
                RoleId = 2,
                Department = "IT Support",
                IsActive = true,
                CreatedBy = u1.Id,
                CreatedAt = baseDate.AddDays(-20),
                TokenVersion = 0
            };

            var u7 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Eve Agent",
                Email = "eve.agent@test.com",
                PasswordHash = passwordHash,
                RoleId = 2,
                Department = "IT Support",
                IsActive = true,
                CreatedBy = u2.Id,
                CreatedAt = baseDate.AddDays(-140),
                TokenVersion = 0
            };

            var u8 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Eve Manager",
                Email = "eve.manager@test.com",
                PasswordHash = passwordHash,
                RoleId = 3,
                Department = "IT Ops",
                IsActive = true,
                CreatedBy = u1.Id,
                CreatedAt = baseDate.AddDays(-135),
                TokenVersion = 0
            };

            var u9 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Frank Manager",
                Email = "frank.manager@test.com",
                PasswordHash = passwordHash,
                RoleId = 3,
                Department = "IT Ops",
                IsActive = false,
                CreatedBy = u1.Id,
                CreatedAt = baseDate.AddDays(-130),
                TokenVersion = 0
            };

            var u10 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Diana Employee",
                Email = "diana@test.com",
                PasswordHash = passwordHash,
                RoleId = 4,
                Department = "Engineering",
                IsActive = true,
                CreatedBy = u2.Id,
                CreatedAt = baseDate.AddDays(-120),
                TokenVersion = 0
            };

            var u11 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Heidi Employee",
                Email = "heidi@test.com",
                PasswordHash = passwordHash,
                RoleId = 4,
                Department = "Marketing",
                IsActive = true,
                CreatedBy = u2.Id,
                CreatedAt = baseDate.AddDays(-110),
                TokenVersion = 0
            };

            var u12 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Ivan Employee",
                Email = "ivan@test.com",
                PasswordHash = passwordHash,
                RoleId = 4,
                Department = "Finance",
                IsActive = true,
                CreatedBy = u2.Id,
                CreatedAt = baseDate.AddDays(-10),
                TokenVersion = 0
            };

            var u13 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Judy Employee",
                Email = "judy@test.com",
                PasswordHash = passwordHash,
                RoleId = 4,
                Department = "HR",
                IsActive = false,
                CreatedBy = u2.Id,
                CreatedAt = baseDate.AddDays(-100),
                TokenVersion = 0
            };

            var u14 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Kevin Employee",
                Email = "kevin@test.com",
                PasswordHash = passwordHash,
                RoleId = 4,
                Department = "Sales",
                IsActive = true,
                CreatedBy = u2.Id,
                CreatedAt = baseDate.AddDays(-50),
                TokenVersion = 0
            };

            var u15 = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Laura Employee",
                Email = "laura@test.com",
                PasswordHash = passwordHash,
                RoleId = 4,
                Department = "Legal",
                IsActive = true,
                CreatedBy = u1.Id,
                CreatedAt = baseDate.AddDays(-30),
                TokenVersion = 0
            };

            context.Users.AddRange(u1, u2, u3, u4, u5, u6, u7, u8, u9, u10, u11, u12, u13, u14, u15);
            await context.SaveChangesAsync();

            var allUsers = new[] { u1, u2, u3, u4, u5, u6, u7, u8, u9, u10, u11, u12, u13, u14, u15 };
            var allAgents = new[] { u4, u5, u6, u7 };

            // =========================================================
            // TICKETS (35)
            // =========================================================
            var now = baseDate;

            // T1 - Critical, In Progress, SLA breached, multi-comment, multi-attachment
            var t1 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260703-1001",
                Title = "Primary server rack cooling failure",
                Description = "The AC unit in Server Room B has failed. Temperature rising above 30°C. Need immediate intervention before servers overheat.",
                CategoryId = 1,
                PriorityId = 4,
                StatusId = 2,
                CreatedBy = u10.Id,
                AssignedTo = u4.Id,
                CreatedAt = now.AddDays(-2).AddHours(8),
                UpdatedAt = now.AddDays(-2).AddHours(10),
                SlaDeadline = now.AddDays(-2).AddHours(12),
                SlaBreachedAt = now.AddDays(-2).AddHours(12).AddMinutes(5)
            };

            // T2 - High, Open, unassigned, within SLA, no comments
            var t2 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260704-1002",
                Title = "VPN client update failing across team",
                Description = "After the latest VPN client update, 5 team members in Engineering cannot connect. Error: 'Connection rejected by server'.",
                CategoryId = 3,
                PriorityId = 3,
                StatusId = 1,
                CreatedBy = u10.Id,
                CreatedAt = now.AddDays(-1).AddHours(10),
                SlaDeadline = now.AddDays(-1).AddHours(18)
            };

            // T3 - Low, Resolved, within SLA, quick resolution
            var t3 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260628-1003",
                Title = "Keyboard keycap replacement",
                Description = "The 'Enter' key cap on my keyboard popped off. Need a replacement keycap.",
                CategoryId = 1,
                PriorityId = 1,
                StatusId = 3,
                CreatedBy = u11.Id,
                AssignedTo = u5.Id,
                CreatedAt = now.AddDays(-7).AddHours(9),
                UpdatedAt = now.AddDays(-7).AddHours(10),
                ResolvedAt = now.AddDays(-7).AddHours(10),
                SlaDeadline = now.AddDays(-4).AddHours(9)
            };

            // T4 - Low, Closed, full lifecycle
            var t4 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260605-1004",
                Title = "Setup dual monitors for new hire",
                Description = "New software engineer Sarah needs dual monitor setup with docking station. Starting June 1.",
                CategoryId = 1,
                PriorityId = 1,
                StatusId = 4,
                CreatedBy = u8.Id,
                AssignedTo = u4.Id,
                CreatedAt = now.AddDays(-30).AddHours(8),
                UpdatedAt = now.AddDays(-29).AddHours(10),
                ResolvedAt = now.AddDays(-29).AddHours(9),
                ClosedAt = now.AddDays(-29).AddHours(10),
                SlaDeadline = now.AddDays(-27).AddHours(8)
            };

            // T5 - Medium, Cancelled from Open
            var t5 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260625-1005",
                Title = "Request Jira admin access",
                Description = "Need Jira administrator access for configuring project workflows for the QA team.",
                CategoryId = 4,
                PriorityId = 2,
                StatusId = 5,
                CreatedBy = u10.Id,
                AssignedTo = u5.Id,
                CreatedAt = now.AddDays(-10).AddHours(14),
                UpdatedAt = now.AddDays(-9).AddHours(8),
                SlaDeadline = now.AddDays(-9).AddHours(14)
            };

            // T6 - High, Pending, SLA breached, waiting on vendor
            var t6 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260702-1006",
                Title = "Cisco switch replacement under warranty",
                Description = "The network switch on Floor 2 is dropping packets intermittently. Needs RMA replacement through vendor.",
                CategoryId = 3,
                PriorityId = 3,
                StatusId = 6,
                CreatedBy = u11.Id,
                AssignedTo = u5.Id,
                CreatedAt = now.AddDays(-3).AddHours(11),
                UpdatedAt = now.AddDays(-2).AddHours(9),
                SlaDeadline = now.AddDays(-2).AddHours(19),
                SlaBreachedAt = now.AddDays(-2).AddHours(19).AddMinutes(10)
            };

            // T7 - Medium, Open, assigned, created yesterday
            var t7 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260704-1007",
                Title = "Outlook not syncing shared mailboxes",
                Description = "Shared mailbox 'sales@idscorp.com' stopped syncing in Outlook desktop app since yesterday.",
                CategoryId = 6,
                PriorityId = 2,
                StatusId = 1,
                CreatedBy = u10.Id,
                AssignedTo = u5.Id,
                CreatedAt = now.AddDays(-1).AddHours(14),
                SlaDeadline = now.AddDays(0).AddHours(14)
            };

            // T8 - Low, Closed, single comment
            var t8 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260615-1008",
                Title = "Update department mailing list",
                Description = "Please remove John from the Engineering mailing list as he has transferred to Product.",
                CategoryId = 6,
                PriorityId = 1,
                StatusId = 4,
                CreatedBy = u10.Id,
                AssignedTo = u4.Id,
                CreatedAt = now.AddDays(-20).AddHours(9),
                UpdatedAt = now.AddDays(-20).AddHours(11),
                ResolvedAt = now.AddDays(-20).AddHours(10),
                ClosedAt = now.AddDays(-20).AddHours(11),
                SlaDeadline = now.AddDays(-17).AddHours(9)
            };

            // T9 - Critical, In Progress, SLA breached, reassigned twice
            var t9 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260703-1009",
                Title = "Database server unresponsive",
                Description = "Production PostgreSQL database is unresponsive. Application team reporting 503 errors on customer-facing portal.",
                CategoryId = 2,
                PriorityId = 4,
                StatusId = 2,
                CreatedBy = u12.Id,
                AssignedTo = u6.Id,
                CreatedAt = now.AddDays(-2).AddHours(6),
                UpdatedAt = now.AddDays(-2).AddHours(14),
                SlaDeadline = now.AddDays(-2).AddHours(10),
                SlaBreachedAt = now.AddDays(-2).AddHours(10).AddMinutes(3)
            };

            // T10 - Low, Open, unassigned, just created today
            var t10 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260705-1010",
                Title = "Request Adobe Fonts license",
                Description = "Need Adobe Fonts added to our Creative Cloud subscription for the marketing team's new campaign.",
                CategoryId = 2,
                PriorityId = 1,
                StatusId = 1,
                CreatedBy = u11.Id,
                CreatedAt = now.AddHours(9),
                SlaDeadline = now.AddHours(81)
            };

            // T11 - Medium, Cancelled by employee
            var t11 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260630-1011",
                Title = "New standing desk order",
                Description = "I'd like to order a standing desk converter for my workstation per the ergonomics policy.",
                CategoryId = 1,
                PriorityId = 2,
                StatusId = 5,
                CreatedBy = u10.Id,
                CreatedAt = now.AddDays(-5).AddHours(10),
                SlaDeadline = now.AddDays(-4).AddHours(10)
            };

            // T12 - High, In Progress, within SLA, fresh
            var t12 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260704-1012",
                Title = "WiFi authentication failure on guest network",
                Description = "Visitors in the lobby cannot connect to the guest WiFi. Portal page shows 'authentication service unavailable'.",
                CategoryId = 3,
                PriorityId = 3,
                StatusId = 2,
                CreatedBy = u11.Id,
                AssignedTo = u4.Id,
                CreatedAt = now.AddDays(-1).AddHours(16),
                UpdatedAt = now.AddDays(-0).AddHours(14),
                SlaDeadline = now.AddDays(0).AddHours(0)
            };

            // T13 - Medium, Resolved, exact SLA match
            var t13 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260630-1013",
                Title = "Replace toner cartridge on Floor 3 printer",
                Description = "The HP LaserJet on Floor 3 is showing 'Replace Toner' message. We have spare cartridges in the supply closet.",
                CategoryId = 1,
                PriorityId = 2,
                StatusId = 3,
                CreatedBy = u10.Id,
                AssignedTo = u4.Id,
                CreatedAt = now.AddDays(-5).AddHours(8),
                UpdatedAt = now.AddDays(-4).AddHours(8),
                ResolvedAt = now.AddDays(-4).AddHours(8),
                SlaDeadline = now.AddDays(-4).AddHours(8)
            };

            // T14 - Critical, Open, unassigned, SLA breached (urgent demo item)
            var t14 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260701-1014",
                Title = "Security breach - unauthorized access detected",
                Description = "SIEM alert indicates unauthorized access attempt from IP 185.220.101.x targeting HR shared drive. Needs immediate investigation.",
                CategoryId = 3,
                PriorityId = 4,
                StatusId = 1,
                CreatedBy = u8.Id,
                CreatedAt = now.AddDays(-4).AddHours(2),
                SlaDeadline = now.AddDays(-4).AddHours(6),
                SlaBreachedAt = now.AddDays(-4).AddHours(6).AddMinutes(1)
            };

            // T15 - High, Resolved, within SLA, security incident
            var t15 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260625-1015",
                Title = "Phishing campaign reported",
                Description = "Multiple employees reported receiving suspicious 'Dropbox password expired' emails. IT needs to investigate and block the sender domain.",
                CategoryId = 6,
                PriorityId = 3,
                StatusId = 3,
                CreatedBy = u10.Id,
                AssignedTo = u5.Id,
                CreatedAt = now.AddDays(-10).AddHours(6),
                UpdatedAt = now.AddDays(-10).AddHours(9),
                ResolvedAt = now.AddDays(-10).AddHours(9),
                SlaDeadline = now.AddDays(-10).AddHours(14)
            };

            // T16 - Medium, Pending, waiting on delivery
            var t16 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260703-1016",
                Title = "Order replacement laptop for developer",
                Description = "Dave's MacBook Pro (2020) has a cracked screen. Needs replacement approved and ordered through procurement.",
                CategoryId = 1,
                PriorityId = 2,
                StatusId = 6,
                CreatedBy = u8.Id,
                AssignedTo = u5.Id,
                CreatedAt = now.AddDays(-2).AddHours(10),
                UpdatedAt = now.AddDays(-1).AddHours(8),
                SlaDeadline = now.AddDays(-1).AddHours(10)
            };

            // T17 - Low, In Progress, reopened (Resolved -> In Progress)
            var t17 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260702-1017",
                Title = "Mouse battery drain issue",
                Description = "Logitech MX Master 3 battery only lasts 2 days instead of advertised 70 days. Replaced once but issue persists.",
                CategoryId = 1,
                PriorityId = 1,
                StatusId = 2,
                CreatedBy = u10.Id,
                AssignedTo = u7.Id,
                CreatedAt = now.AddDays(-3).AddHours(14),
                UpdatedAt = now.AddDays(-2).AddHours(10),
                ResolvedAt = now.AddDays(-2).AddHours(10),
                SlaDeadline = now.AddDays(0).AddHours(14)
            };

            // T18 - High, Resolved, old, for chart data
            var t18 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260620-1018",
                Title = "Confluence permissions overhaul",
                Description = "Need to restructure Confluence space permissions. Remove all old contractors and align with new org chart.",
                CategoryId = 4,
                PriorityId = 3,
                StatusId = 3,
                CreatedBy = u10.Id,
                AssignedTo = u4.Id,
                CreatedAt = now.AddDays(-15).AddHours(10),
                UpdatedAt = now.AddDays(-14).AddHours(15),
                ResolvedAt = now.AddDays(-14).AddHours(15),
                SlaDeadline = now.AddDays(-14).AddHours(18)
            };

            // T19 - Low, Closed, very old
            var t19 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260610-1019",
                Title = "Request office plant watering schedule",
                Description = "Can we set up a watering schedule for the office plants? Marketing team wants to help maintain them.",
                CategoryId = 5,
                PriorityId = 1,
                StatusId = 4,
                CreatedBy = u11.Id,
                AssignedTo = u4.Id,
                CreatedAt = now.AddDays(-25).AddHours(9),
                UpdatedAt = now.AddDays(-24).AddHours(10),
                ResolvedAt = now.AddDays(-24).AddHours(9),
                ClosedAt = now.AddDays(-24).AddHours(10),
                SlaDeadline = now.AddDays(-22).AddHours(9)
            };

            // T20 - Critical, Pending, breached
            var t20 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260701-1020",
                Title = "Production web server certificate expired",
                Description = "SSL certificate for www.idscorp.com expired at midnight. Website showing security warning to all visitors.",
                CategoryId = 3,
                PriorityId = 4,
                StatusId = 6,
                CreatedBy = u10.Id,
                AssignedTo = u5.Id,
                CreatedAt = now.AddDays(-4).AddHours(1),
                UpdatedAt = now.AddDays(-4).AddHours(5),
                SlaDeadline = now.AddDays(-4).AddHours(5),
                SlaBreachedAt = now.AddDays(-4).AddHours(5).AddMinutes(1)
            };

            // T21 - High, Open, created by Admin
            var t21 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260704-1021",
                Title = "Audit: Review all active directory security groups",
                Description = "Quarterly security audit requires review of all AD security groups to remove stale users and unused groups.",
                CategoryId = 4,
                PriorityId = 3,
                StatusId = 1,
                CreatedBy = u2.Id,
                AssignedTo = u7.Id,
                CreatedAt = now.AddDays(-1).AddHours(8),
                SlaDeadline = now.AddDays(-1).AddHours(16)
            };

            // T22 - Medium, Open, created today (for CreatedToday KPI)
            var t22 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260705-1022",
                Title = "Install Python 3.12 on build server",
                Description = "CI/CD pipeline requires Python 3.12 for the new microservices. Currently on 3.9. Need admin rights to install.",
                CategoryId = 2,
                PriorityId = 2,
                StatusId = 1,
                CreatedBy = u12.Id,
                CreatedAt = now.AddHours(7),
                SlaDeadline = now.AddHours(31)
            };

            // T23 - Critical, In Progress, SLA breached, multi-attachment
            var t23 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260702-1023",
                Title = "Video conferencing system outage in HQ",
                Description = "All Zoom Rooms in the HQ building are offline. System shows 'hardware not detected' on all 12 conference room units.",
                CategoryId = 1,
                PriorityId = 4,
                StatusId = 2,
                CreatedBy = u10.Id,
                AssignedTo = u6.Id,
                CreatedAt = now.AddDays(-3).AddHours(7),
                UpdatedAt = now.AddDays(-2).AddHours(16),
                SlaDeadline = now.AddDays(-3).AddHours(11),
                SlaBreachedAt = now.AddDays(-3).AddHours(11).AddMinutes(2)
            };

            // T24 - Low, Closed, created by inactive user (Judy)
            var t24 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260515-1024",
                Title = "Old: Request HR system training access",
                Description = "Need access to the HR training module for the new performance review system.",
                CategoryId = 4,
                PriorityId = 1,
                StatusId = 4,
                CreatedBy = u13.Id,
                AssignedTo = u4.Id,
                CreatedAt = now.AddDays(-51).AddHours(8),
                UpdatedAt = now.AddDays(-50).AddHours(8),
                ResolvedAt = now.AddDays(-50).AddHours(7),
                ClosedAt = now.AddDays(-50).AddHours(8),
                SlaDeadline = now.AddDays(-48).AddHours(8)
            };

            // T25 - High, Resolved, assigned->unassigned->reassigned
            var t25 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260620-1025",
                Title = "Migrate shared mailboxes to cloud",
                Description = "Need to migrate 5 shared mailboxes from on-prem Exchange to Exchange Online. Coordinate with team leads.",
                CategoryId = 6,
                PriorityId = 3,
                StatusId = 3,
                CreatedBy = u10.Id,
                AssignedTo = u7.Id,
                CreatedAt = now.AddDays(-15).AddHours(11),
                UpdatedAt = now.AddDays(-14).AddHours(14),
                ResolvedAt = now.AddDays(-14).AddHours(14),
                SlaDeadline = now.AddDays(-14).AddHours(19)
            };

            // T26 - Low, Cancelled from In Progress
            var t26 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260628-1026",
                Title = "Create department wiki template",
                Description = "Need a standardized wiki template for all department documentation with headers, TOC, and version history.",
                CategoryId = 5,
                PriorityId = 1,
                StatusId = 5,
                CreatedBy = u10.Id,
                AssignedTo = u5.Id,
                CreatedAt = now.AddDays(-7).AddHours(8),
                UpdatedAt = now.AddDays(-6).AddHours(10),
                SlaDeadline = now.AddDays(-4).AddHours(8)
            };

            // T27 - Low, Open, created today by Kevin
            var t27 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260705-1027",
                Title = "Request CRM training materials",
                Description = "New sales rep needs access to the Salesforce training portal and materials for onboarding.",
                CategoryId = 2,
                PriorityId = 1,
                StatusId = 1,
                CreatedBy = u14.Id,
                CreatedAt = now.AddHours(8).AddMinutes(30),
                SlaDeadline = now.AddHours(80).AddMinutes(30)
            };

            // T28 - Medium, Pending, SLA breached
            var t28 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260702-1028",
                Title = "Procurement: 5TB external hard drives",
                Description = "Need 3x 5TB external SSDs for the video production team's backup workflow. Approved in budget but need PO.",
                CategoryId = 1,
                PriorityId = 2,
                StatusId = 6,
                CreatedBy = u11.Id,
                AssignedTo = u4.Id,
                CreatedAt = now.AddDays(-3).AddHours(9),
                UpdatedAt = now.AddDays(-2).AddHours(11),
                SlaDeadline = now.AddDays(-2).AddHours(9),
                SlaBreachedAt = now.AddDays(-2).AddHours(9).AddMinutes(5)
            };

            // T29 - Critical, Resolved but breached (resolved after deadline)
            var t29 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260701-1029",
                Title = "Emergency patch: Critical RCE vulnerability",
                Description = "CVE-2026-3344 affects our web server stack. Needs immediate patching per security team directive.",
                CategoryId = 2,
                PriorityId = 4,
                StatusId = 3,
                CreatedBy = u8.Id,
                AssignedTo = u4.Id,
                CreatedAt = now.AddDays(-4).AddHours(14),
                UpdatedAt = now.AddDays(-4).AddHours(20),
                ResolvedAt = now.AddDays(-4).AddHours(20),
                SlaDeadline = now.AddDays(-4).AddHours(18),
                SlaBreachedAt = now.AddDays(-4).AddHours(18).AddMinutes(1)
            };

            // T30 - Medium, Open, created today by Diana
            var t30 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260705-1030",
                Title = "GitLab CI runner not picking up jobs",
                Description = "The shared GitLab runner in the Engineering namespace stopped picking up CI jobs. Last successful run was Friday evening.",
                CategoryId = 2,
                PriorityId = 2,
                StatusId = 1,
                CreatedBy = u10.Id,
                AssignedTo = u6.Id,
                CreatedAt = now.AddHours(6).AddMinutes(45),
                SlaDeadline = now.AddHours(30).AddMinutes(45)
            };

            // T31 - High, In Progress, within SLA, attachment from agent
            var t31 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260703-1031",
                Title = "Firewall rule update for new office",
                Description = "New branch office in KL needs firewall rules configured. VPN tunnel established but no traffic passing through.",
                CategoryId = 3,
                PriorityId = 3,
                StatusId = 2,
                CreatedBy = u14.Id,
                AssignedTo = u4.Id,
                CreatedAt = now.AddDays(-2).AddHours(14),
                UpdatedAt = now.AddDays(-1).AddHours(11),
                SlaDeadline = now.AddDays(-1).AddHours(22)
            };

            // T32 - Medium, Resolved, no comments
            var t32 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260615-1032",
                Title = "Increase Jira attachment size limit",
                Description = "The default 10MB attachment limit in Jira is too low. Need to increase to 50MB for the QA team's test evidence uploads.",
                CategoryId = 2,
                PriorityId = 2,
                StatusId = 3,
                CreatedBy = u10.Id,
                AssignedTo = u5.Id,
                CreatedAt = now.AddDays(-20).AddHours(13),
                UpdatedAt = now.AddDays(-20).AddHours(14),
                ResolvedAt = now.AddDays(-20).AddHours(14),
                SlaDeadline = now.AddDays(-19).AddHours(13)
            };

            // T33 - Low, Open, unassigned, bare ticket (edge case)
            var t33 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260705-1033",
                Title = "Update Slack emoji pack",
                Description = "Can we add the new company logo and some custom emojis to the workspace? Marketing has prepared a set.",
                CategoryId = 5,
                PriorityId = 1,
                StatusId = 1,
                CreatedBy = u15.Id,
                CreatedAt = now.AddHours(10),
                SlaDeadline = now.AddHours(82)
            };

            // T34 - Medium, Closed by Admin
            var t34 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260702-1034",
                Title = "Deploy new company wallpaper",
                Description = "IT to deploy the new company-branded desktop wallpaper to all managed Windows workstations via Group Policy.",
                CategoryId = 5,
                PriorityId = 2,
                StatusId = 4,
                CreatedBy = u15.Id,
                AssignedTo = u7.Id,
                CreatedAt = now.AddDays(-3).AddHours(8),
                UpdatedAt = now.AddDays(-2).AddHours(16),
                ResolvedAt = now.AddDays(-2).AddHours(15),
                ClosedAt = now.AddDays(-2).AddHours(16),
                SlaDeadline = now.AddDays(-2).AddHours(8)
            };

            // T35 - Pending, Low, unassigned, no SLA deadline
            var t35 = new Ticket
            {
                Id = Guid.NewGuid(),
                ReferenceNumber = "TKT-20260630-1035",
                Title = "Suggestion: Add water dispenser to Floor 4",
                Description = "The water dispenser on Floor 4 has been removed for maintenance and not replaced. Many employees requesting a new one.",
                CategoryId = 5,
                PriorityId = 1,
                StatusId = 6,
                CreatedBy = u10.Id,
                CreatedAt = now.AddDays(-5).AddHours(11),
                SlaDeadline = now.AddDays(-2).AddHours(11),
                SlaBreachedAt = now.AddDays(-2).AddHours(11).AddMinutes(5)
            };

            context.Tickets.AddRange(t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13, t14, t15, t16, t17, t18, t19, t20, t21, t22, t23, t24, t25, t26, t27, t28, t29, t30, t31, t32, t33, t34, t35);

            var allTickets = new[] { t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13, t14, t15, t16, t17, t18, t19, t20, t21, t22, t23, t24, t25, t26, t27, t28, t29, t30, t31, t32, t33, t34, t35 };

            // =========================================================
            // STATUS HISTORY (55 entries - covers all transitions)
            // =========================================================
            var statusHistory = new List<TicketStatusHistory>();

            // T1: Open -> In Progress
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t1.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-2).AddHours(10), Notes = "Engineer dispatched to Server Room B" });
            // T3: Open -> Resolved (quick)
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t3.Id, ChangedBy = u5.Id, OldStatusId = 1, NewStatusId = 3, ChangedAt = now.AddDays(-7).AddHours(10), Notes = "Provided replacement keycap from stock" });
            // T4: Open -> In Progress -> Resolved -> Closed
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t4.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-30).AddHours(9) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t4.Id, ChangedBy = u4.Id, OldStatusId = 2, NewStatusId = 3, ChangedAt = now.AddDays(-29).AddHours(9), Notes = "Dual monitors set up and tested" });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t4.Id, ChangedBy = u8.Id, OldStatusId = 3, NewStatusId = 4, ChangedAt = now.AddDays(-29).AddHours(10) });
            // T5: Open -> Cancelled
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t5.Id, ChangedBy = u10.Id, OldStatusId = 1, NewStatusId = 5, ChangedAt = now.AddDays(-9).AddHours(8), Notes = "No longer needed - manager handled directly" });
            // T6: Open -> In Progress -> Pending
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t6.Id, ChangedBy = u5.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-3).AddHours(12), Notes = "Diagnosing packet loss issue" });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t6.Id, ChangedBy = u5.Id, OldStatusId = 2, NewStatusId = 6, ChangedAt = now.AddDays(-2).AddHours(9), Notes = "Waiting on vendor RMA - Cisco case #CX-2026-8844" });
            // T8: Open -> Resolved -> Closed
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t8.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 3, ChangedAt = now.AddDays(-20).AddHours(10), Notes = "Mailing list updated" });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t8.Id, ChangedBy = u4.Id, OldStatusId = 3, NewStatusId = 4, ChangedAt = now.AddDays(-20).AddHours(11) });
            // T9: Open -> In Progress (Bob initially) -> In Progress (Dave after reassign)
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t9.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-2).AddHours(7), Notes = "Initial investigation started" });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t9.Id, ChangedBy = u1.Id, OldStatusId = 2, NewStatusId = 2, ChangedAt = now.AddDays(-2).AddHours(14), Notes = "Reassigned to Dave - Bob focused on cooling issue" });
            // T11: Open -> Cancelled (by employee)
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t11.Id, ChangedBy = u10.Id, OldStatusId = 1, NewStatusId = 5, ChangedAt = now.AddDays(-4).AddHours(14), Notes = "Decided not to proceed - using books instead" });
            // T12: Open -> In Progress
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t12.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(0).AddHours(14), Notes = "Testing captive portal configuration" });
            // T13: Open -> Resolved (exact SLA match)
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t13.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 3, ChangedAt = now.AddDays(-4).AddHours(8), Notes = "Toner replaced, printer tested OK" });
            // T15: Open -> In Progress -> Resolved
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t15.Id, ChangedBy = u5.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-10).AddHours(7) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t15.Id, ChangedBy = u5.Id, OldStatusId = 2, NewStatusId = 3, ChangedAt = now.AddDays(-10).AddHours(9), Notes = "Phishing domain blocked, employee awareness email sent" });
            // T16: Open -> In Progress -> Pending
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t16.Id, ChangedBy = u5.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-2).AddHours(12) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t16.Id, ChangedBy = u5.Id, OldStatusId = 2, NewStatusId = 6, ChangedAt = now.AddDays(-1).AddHours(8), Notes = "Awaiting procurement approval for MacBook Pro 14" });
            // T17: Open -> In Progress -> Resolved -> In Progress (reopened)
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t17.Id, ChangedBy = u7.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-3).AddHours(15) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t17.Id, ChangedBy = u7.Id, OldStatusId = 2, NewStatusId = 3, ChangedAt = now.AddDays(-2).AddHours(10), Notes = "Replaced mouse - testing with new unit" });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t17.Id, ChangedBy = u10.Id, OldStatusId = 3, NewStatusId = 2, ChangedAt = now.AddDays(-1).AddHours(9), Notes = "Replacement also has same issue. Reopening ticket." });
            // T18: Open -> In Progress -> Resolved
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t18.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-15).AddHours(11) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t18.Id, ChangedBy = u4.Id, OldStatusId = 2, NewStatusId = 3, ChangedAt = now.AddDays(-14).AddHours(15), Notes = "Permissions restructured per org chart" });
            // T19: Open -> In Progress -> Resolved -> Closed
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t19.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-25).AddHours(10) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t19.Id, ChangedBy = u4.Id, OldStatusId = 2, NewStatusId = 3, ChangedAt = now.AddDays(-24).AddHours(9), Notes = "Schedule created, plants watered" });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t19.Id, ChangedBy = u4.Id, OldStatusId = 3, NewStatusId = 4, ChangedAt = now.AddDays(-24).AddHours(10) });
            // T20: Open -> In Progress -> Pending
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t20.Id, ChangedBy = u5.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-4).AddHours(3), Notes = "Emergency - starting cert renewal process" });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t20.Id, ChangedBy = u5.Id, OldStatusId = 2, NewStatusId = 6, ChangedAt = now.AddDays(-4).AddHours(5), Notes = "Certificate order placed with DigiCert. Awaiting issuance." });
            // T23: Open -> In Progress
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t23.Id, ChangedBy = u6.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-3).AddHours(8), Notes = "Running diagnostic on Zoom Room controllers" });
            // T24: Open -> In Progress -> Resolved -> Closed
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t24.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-51).AddHours(9) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t24.Id, ChangedBy = u4.Id, OldStatusId = 2, NewStatusId = 3, ChangedAt = now.AddDays(-50).AddHours(7), Notes = "Access granted and training portal configured" });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t24.Id, ChangedBy = u4.Id, OldStatusId = 3, NewStatusId = 4, ChangedAt = now.AddDays(-50).AddHours(8) });
            // T25: Open -> In Progress -> Resolved
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t25.Id, ChangedBy = u7.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-15).AddHours(12) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t25.Id, ChangedBy = u7.Id, OldStatusId = 2, NewStatusId = 3, ChangedAt = now.AddDays(-14).AddHours(14), Notes = "Migration completed. All mailboxes verified working." });
            // T26: Open -> In Progress -> Cancelled
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t26.Id, ChangedBy = u5.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-7).AddHours(9) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t26.Id, ChangedBy = u1.Id, OldStatusId = 2, NewStatusId = 5, ChangedAt = now.AddDays(-6).AddHours(10), Notes = "Cancelled - template provided by external consultant instead" });
            // T28: Open -> In Progress -> Pending
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t28.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-3).AddHours(10) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t28.Id, ChangedBy = u4.Id, OldStatusId = 2, NewStatusId = 6, ChangedAt = now.AddDays(-2).AddHours(11), Notes = "PO submitted, awaiting finance approval" });
            // T29: Open -> In Progress -> Resolved (breached)
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t29.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-4).AddHours(15) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t29.Id, ChangedBy = u4.Id, OldStatusId = 2, NewStatusId = 3, ChangedAt = now.AddDays(-4).AddHours(20), Notes = "Patch applied and verified. Delayed due to change approval process." });
            // T31: Open -> In Progress
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t31.Id, ChangedBy = u4.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-1).AddHours(11), Notes = "Configuring firewall rules for KL office" });
            // T32: Open -> Resolved (no In Progress)
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t32.Id, ChangedBy = u5.Id, OldStatusId = 1, NewStatusId = 3, ChangedAt = now.AddDays(-20).AddHours(14), Notes = "Attachment limit updated in Jira settings" });
            // T34: Open -> In Progress -> Resolved -> Closed
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t34.Id, ChangedBy = u7.Id, OldStatusId = 1, NewStatusId = 2, ChangedAt = now.AddDays(-3).AddHours(9) });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t34.Id, ChangedBy = u7.Id, OldStatusId = 2, NewStatusId = 3, ChangedAt = now.AddDays(-2).AddHours(15), Notes = "Wallpaper deployed via GPO. Tested on 10 machines." });
            statusHistory.Add(new TicketStatusHistory { Id = Guid.NewGuid(), TicketId = t34.Id, ChangedBy = u1.Id, OldStatusId = 3, NewStatusId = 4, ChangedAt = now.AddDays(-2).AddHours(16) });

            context.TicketStatusHistories.AddRange(statusHistory);

            // =========================================================
            // ASSIGNMENT HISTORY (30 entries)
            // =========================================================
            var assignmentHistory = new List<TicketAssignmentHistory>();

            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t1.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-2).AddHours(8).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t3.Id, AssignedBy = u1.Id, AssignedTo = u5.Id, AssignedAt = now.AddDays(-7).AddHours(9).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t4.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-30).AddHours(8).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t5.Id, AssignedBy = u1.Id, AssignedTo = u5.Id, AssignedAt = now.AddDays(-10).AddHours(14).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t6.Id, AssignedBy = u1.Id, AssignedTo = u5.Id, AssignedAt = now.AddDays(-3).AddHours(11).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t7.Id, AssignedBy = u1.Id, AssignedTo = u5.Id, AssignedAt = now.AddDays(-1).AddHours(14).AddMinutes(15) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t8.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-20).AddHours(9).AddMinutes(30) });
            // T9: reassigned twice: Bob -> Carol -> Dave
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t9.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-2).AddHours(6).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t9.Id, AssignedBy = u1.Id, AssignedTo = u5.Id, AssignedAt = now.AddDays(-2).AddHours(8).AddMinutes(0) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t9.Id, AssignedBy = u1.Id, AssignedTo = u6.Id, AssignedAt = now.AddDays(-2).AddHours(14).AddMinutes(0) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t12.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(0).AddHours(14).AddMinutes(15) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t13.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-5).AddHours(8).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t15.Id, AssignedBy = u2.Id, AssignedTo = u5.Id, AssignedAt = now.AddDays(-10).AddHours(6).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t16.Id, AssignedBy = u1.Id, AssignedTo = u5.Id, AssignedAt = now.AddDays(-2).AddHours(10).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t17.Id, AssignedBy = u1.Id, AssignedTo = u7.Id, AssignedAt = now.AddDays(-3).AddHours(14).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t18.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-15).AddHours(10).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t19.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-25).AddHours(9).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t20.Id, AssignedBy = u1.Id, AssignedTo = u5.Id, AssignedAt = now.AddDays(-4).AddHours(1).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t21.Id, AssignedBy = u2.Id, AssignedTo = u7.Id, AssignedAt = now.AddDays(-1).AddHours(8).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t23.Id, AssignedBy = u1.Id, AssignedTo = u6.Id, AssignedAt = now.AddDays(-3).AddHours(7).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t24.Id, AssignedBy = u2.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-51).AddHours(8).AddMinutes(30) });
            // T25: unassigned then reassigned
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t25.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-15).AddHours(11).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t25.Id, AssignedBy = u1.Id, AssignedTo = null, AssignedAt = now.AddDays(-15).AddHours(14).AddMinutes(0) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t25.Id, AssignedBy = u1.Id, AssignedTo = u7.Id, AssignedAt = now.AddDays(-15).AddHours(16).AddMinutes(0) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t26.Id, AssignedBy = u1.Id, AssignedTo = u5.Id, AssignedAt = now.AddDays(-7).AddHours(8).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t28.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-3).AddHours(9).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t29.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-4).AddHours(14).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t30.Id, AssignedBy = u1.Id, AssignedTo = u6.Id, AssignedAt = now.AddHours(6).AddMinutes(55) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t31.Id, AssignedBy = u1.Id, AssignedTo = u4.Id, AssignedAt = now.AddDays(-2).AddHours(14).AddMinutes(30) });
            assignmentHistory.Add(new TicketAssignmentHistory { Id = Guid.NewGuid(), TicketId = t34.Id, AssignedBy = u1.Id, AssignedTo = u7.Id, AssignedAt = now.AddDays(-3).AddHours(8).AddMinutes(30) });

            context.TicketAssignmentHistories.AddRange(assignmentHistory);

            // =========================================================
            // COMMENTS (45 entries)
            // =========================================================
            var comments = new List<TicketComment>();

            // T1 - 6 comments (3 public, 3 internal) with @mentions
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t1.Id, AuthorId = u4.Id, Body = "Arrived at Server Room B. Temperature is 32°C and rising. AC unit shows error code E-47. Contacting facility management.", IsInternal = false, CreatedAt = now.AddDays(-2).AddHours(8).AddMinutes(45) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t1.Id, AuthorId = u4.Id, Body = "@Alpha Admin Severity critical - we may need to shut down non-essential servers to prevent damage. Need authorization.", IsInternal = true, CreatedAt = now.AddDays(-2).AddHours(9).AddMinutes(15) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t1.Id, AuthorId = u1.Id, Body = "Authorized. Shut down test and staging servers. Keep production running at all costs. Portable AC units being delivered.", IsInternal = true, CreatedAt = now.AddDays(-2).AddHours(9).AddMinutes(45) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t1.Id, AuthorId = u10.Id, Body = "Thanks for the quick response team. How long before the AC is fixed?", IsInternal = false, CreatedAt = now.AddDays(-2).AddHours(10).AddMinutes(15) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t1.Id, AuthorId = u4.Id, Body = "@Carol Agent Can you coordinate with building management on the AC repair timeline? They said ETA is 4 hours.", IsInternal = true, CreatedAt = now.AddDays(-2).AddHours(11).AddMinutes(0) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t1.Id, AuthorId = u5.Id, Body = "Building management dispatched a technician. ETA 2 hours. Portable units in place, temperature stabilizing at 28°C.", IsInternal = false, CreatedAt = now.AddDays(-1).AddHours(8).AddMinutes(0) });
            // T4 - 2 comments
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t4.Id, AuthorId = u4.Id, Body = "Monitors and docking station installed. Verified both displays working at 2560x1440.", IsInternal = false, CreatedAt = now.AddDays(-29).AddHours(9).AddMinutes(30) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t4.Id, AuthorId = u8.Id, Body = "Confirmed working. Sarah is happy with the setup. Thanks!", IsInternal = false, CreatedAt = now.AddDays(-29).AddHours(10).AddMinutes(15) });
            // T6 - 3 comments (1 internal)
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t6.Id, AuthorId = u5.Id, Body = "Confirmed packet loss at 15% on switch ports 5-12. Opened RMA case with Cisco.", IsInternal = false, CreatedAt = now.AddDays(-3).AddHours(12).AddMinutes(30) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t6.Id, AuthorId = u11.Id, Body = "Is there a timeline for the replacement? This is affecting our team's productivity.", IsInternal = false, CreatedAt = now.AddDays(-2).AddHours(10).AddMinutes(0) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t6.Id, AuthorId = u5.Id, Body = "Cisco says 3-5 business days for RMA processing. @Eve Manager can we approve a temporary replacement from stock?", IsInternal = true, CreatedAt = now.AddDays(-2).AddHours(11).AddMinutes(0) });
            // T7 - 1 comment
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t7.Id, AuthorId = u5.Id, Body = "Checking Exchange Online configuration. Shared mailbox permissions may need to be re-applied after recent migration.", IsInternal = false, CreatedAt = now.AddDays(0).AddHours(8).AddMinutes(30) });
            // T8 - 1 comment
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t8.Id, AuthorId = u4.Id, Body = "Removed John from Engineering list. Added him to Product list per his new role.", IsInternal = false, CreatedAt = now.AddDays(-20).AddHours(10).AddMinutes(15) });
            // T9 - 4 comments
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t9.Id, AuthorId = u4.Id, Body = "Initial diagnostics: Database is in recovery mode after unexpected restart. Checking logs.", IsInternal = false, CreatedAt = now.AddDays(-2).AddHours(7).AddMinutes(30) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t9.Id, AuthorId = u4.Id, Body = "This looks like an OOM kill. The server only has 8GB RAM allocated but the DB is using 7.5GB. @Carol Agent can you help with query optimization?", IsInternal = true, CreatedAt = now.AddDays(-2).AddHours(9).AddMinutes(0) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t9.Id, AuthorId = u5.Id, Body = "Analyzing slow queries. Found 3 queries running without proper indexing. Will create indexes.", IsInternal = true, CreatedAt = now.AddDays(-2).AddHours(10).AddMinutes(30) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t9.Id, AuthorId = u12.Id, Body = "Is the portal back up? Users are reporting errors.", IsInternal = false, CreatedAt = now.AddDays(-2).AddHours(15).AddMinutes(0) });
            // T12 - 2 comments
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t12.Id, AuthorId = u4.Id, Body = "Found issue: RADIUS server certificate expired. Renewing certificate and testing.", IsInternal = false, CreatedAt = now.AddDays(0).AddHours(14).AddMinutes(30) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t12.Id, AuthorId = u4.Id, Body = "@Dave Agent Can you verify the new cert is deployed to all APs?", IsInternal = true, CreatedAt = now.AddDays(0).AddHours(15).AddMinutes(0) });
            // T13 - 1 comment
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t13.Id, AuthorId = u4.Id, Body = "Replaced toner cartridge. Printer self-test passed. User confirmed working.", IsInternal = false, CreatedAt = now.AddDays(-4).AddHours(8).AddMinutes(30) });
            // T15 - 3 comments
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t15.Id, AuthorId = u5.Id, Body = "Analyzing the phishing email headers. Domain registered 2 days ago. Blocking at mail gateway.", IsInternal = false, CreatedAt = now.AddDays(-10).AddHours(7).AddMinutes(30) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t15.Id, AuthorId = u5.Id, Body = "No users appear to have clicked the link. Sending awareness reminder to all staff.", IsInternal = true, CreatedAt = now.AddDays(-10).AddHours(8).AddMinutes(0) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t15.Id, AuthorId = u10.Id, Body = "Thank you for the quick action! I'll let the team know it's been handled.", IsInternal = false, CreatedAt = now.AddDays(-10).AddHours(8).AddMinutes(45) });
            // T16 - 2 comments
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t16.Id, AuthorId = u5.Id, Body = "Cracked screen assessed. Apple quoted $799 for replacement. Submitted PO request.", IsInternal = false, CreatedAt = now.AddDays(-2).AddHours(12).AddMinutes(30) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t16.Id, AuthorId = u5.Id, Body = "@Grace Admin Can you expedite PO-2026-4421 for the MacBook replacement? User has been waiting.", IsInternal = true, CreatedAt = now.AddDays(-1).AddHours(8).AddMinutes(30) });
            // T17 - 2 comments
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t17.Id, AuthorId = u7.Id, Body = "Replaced mouse with new unit from inventory. User to test and report back.", IsInternal = false, CreatedAt = now.AddDays(-2).AddHours(10).AddMinutes(15) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t17.Id, AuthorId = u10.Id, Body = "The replacement has the same issue! Battery drains overnight. There might be a firmware issue with this batch.", IsInternal = false, CreatedAt = now.AddDays(-1).AddHours(9).AddMinutes(0) });
            // T20 - 2 comments
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t20.Id, AuthorId = u5.Id, Body = "Ordered emergency certificate from DigiCert. Installing once issued. Temporary warning page in place.", IsInternal = false, CreatedAt = now.AddDays(-4).AddHours(3).AddMinutes(30) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t20.Id, AuthorId = u5.Id, Body = "DigiCert confirmed issuance in 1-2 hours. Applied for expedited validation.", IsInternal = true, CreatedAt = now.AddDays(-4).AddHours(4).AddMinutes(30) });
            // T23 - 3 comments
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t23.Id, AuthorId = u6.Id, Body = "All 12 Zoom Rooms showing 'hardware not detected'. Checking the Zoom Room controller service on the Intel NUCs.", IsInternal = false, CreatedAt = now.AddDays(-3).AddHours(8).AddMinutes(30) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t23.Id, AuthorId = u6.Id, Body = "Found the issue - a bad Zoom Rooms update pushed overnight broke the USB camera driver. Rolling back.", IsInternal = false, CreatedAt = now.AddDays(-3).AddHours(10).AddMinutes(0) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t23.Id, AuthorId = u10.Id, Body = "Please keep us posted. We have client meetings scheduled in the conference rooms this afternoon.", IsInternal = false, CreatedAt = now.AddDays(-3).AddHours(10).AddMinutes(30) });
            // T25 - 1 comment
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t25.Id, AuthorId = u7.Id, Body = "All 5 mailboxes migrated successfully. Verified send/receive working on all accounts.", IsInternal = false, CreatedAt = now.AddDays(-14).AddHours(14).AddMinutes(30) });
            // T28 - 1 comment
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t28.Id, AuthorId = u4.Id, Body = "PO submitted to finance. Awaiting approval. Estimated delivery 5-7 working days.", IsInternal = false, CreatedAt = now.AddDays(-2).AddHours(11).AddMinutes(30) });
            // T29 - 2 comments
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t29.Id, AuthorId = u4.Id, Body = "Patch downloaded and tested in staging. Change request submitted for production deployment.", IsInternal = false, CreatedAt = now.AddDays(-4).AddHours(16).AddMinutes(0) });
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t29.Id, AuthorId = u4.Id, Body = "Production deployment completed at 20:00. All services verified running. Vulnerability scan clean.", IsInternal = false, CreatedAt = now.AddDays(-4).AddHours(20).AddMinutes(30) });
            // T31 - 1 comment
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t31.Id, AuthorId = u4.Id, Body = "Firewall rules configured. VPN tunnel active. Testing connectivity from KL office. Attaching config file.", IsInternal = false, CreatedAt = now.AddDays(-1).AddHours(11).AddMinutes(30) });
            // T34 - 1 comment
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t34.Id, AuthorId = u7.Id, Body = "Wallpaper deployed via GPO to all Windows workstations. Tested on 10 machines across different OUs.", IsInternal = false, CreatedAt = now.AddDays(-2).AddHours(15).AddMinutes(30) });
            // T35 - 1 comment
            comments.Add(new TicketComment { Id = Guid.NewGuid(), TicketId = t35.Id, AuthorId = u10.Id, Body = "Following up on this - the Floor 4 team really needs a water dispenser. It's been over a week.", IsInternal = false, CreatedAt = now.AddDays(-3).AddHours(14).AddMinutes(0) });

            context.TicketComments.AddRange(comments);

            // =========================================================
            // ATTACHMENTS (20 entries - all MIME types)
            // =========================================================
            var attachments = new List<TicketAttachment>();

            // T1 - 3 attachments
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t1.Id, UploadedBy = u10.Id, FileName = "server_room_temp_reading.jpg", FilePath = $"uploads/{t1.Id}/server_room_temp_reading.jpg", FileSizeBytes = 245000, MimeType = "image/jpeg", UploadedAt = now.AddDays(-2).AddHours(8).AddMinutes(15) });
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t1.Id, UploadedBy = u4.Id, FileName = "ac_error_code_E47_reference.pdf", FilePath = $"uploads/{t1.Id}/ac_error_code_E47_reference.pdf", FileSizeBytes = 420000, MimeType = "application/pdf", UploadedAt = now.AddDays(-2).AddHours(9).AddMinutes(0) });
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t1.Id, UploadedBy = u4.Id, FileName = "temp_log_data.txt", FilePath = $"uploads/{t1.Id}/temp_log_data.txt", FileSizeBytes = 12500, MimeType = "text/plain", UploadedAt = now.AddDays(-2).AddHours(10).AddMinutes(30) });
            // T6 - 2 attachments
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t6.Id, UploadedBy = u11.Id, FileName = "network_packet_loss_report.png", FilePath = $"uploads/{t6.Id}/network_packet_loss_report.png", FileSizeBytes = 512000, MimeType = "image/png", UploadedAt = now.AddDays(-3).AddHours(11).AddMinutes(15) });
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t6.Id, UploadedBy = u5.Id, FileName = "cisco_rma_form.docx", FilePath = $"uploads/{t6.Id}/cisco_rma_form.docx", FileSizeBytes = 95000, MimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document", UploadedAt = now.AddDays(-3).AddHours(12).AddMinutes(45) });
            // T9 - 2 attachments
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t9.Id, UploadedBy = u12.Id, FileName = "database_error_screenshot.png", FilePath = $"uploads/{t9.Id}/database_error_screenshot.png", FileSizeBytes = 340000, MimeType = "image/png", UploadedAt = now.AddDays(-2).AddHours(6).AddMinutes(30) });
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t9.Id, UploadedBy = u4.Id, FileName = "postgres_query_analysis.pdf", FilePath = $"uploads/{t9.Id}/postgres_query_analysis.pdf", FileSizeBytes = 780000, MimeType = "application/pdf", UploadedAt = now.AddDays(-2).AddHours(8).AddMinutes(0) });
            // T12 - 1 attachment
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t12.Id, UploadedBy = u4.Id, FileName = "radius_cert_error.png", FilePath = $"uploads/{t12.Id}/radius_cert_error.png", FileSizeBytes = 280000, MimeType = "image/png", UploadedAt = now.AddDays(0).AddHours(14).AddMinutes(45) });
            // T15 - 2 attachments
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t15.Id, UploadedBy = u10.Id, FileName = "phishing_email_headers.txt", FilePath = $"uploads/{t15.Id}/phishing_email_headers.txt", FileSizeBytes = 8500, MimeType = "text/plain", UploadedAt = now.AddDays(-10).AddHours(6).AddMinutes(15) });
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t15.Id, UploadedBy = u5.Id, FileName = "blocked_domain_report.pdf", FilePath = $"uploads/{t15.Id}/blocked_domain_report.pdf", FileSizeBytes = 150000, MimeType = "application/pdf", UploadedAt = now.AddDays(-10).AddHours(8).AddMinutes(15) });
            // T20 - 2 attachments
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t20.Id, UploadedBy = u10.Id, FileName = "ssl_error_screenshot.png", FilePath = $"uploads/{t20.Id}/ssl_error_screenshot.png", FileSizeBytes = 410000, MimeType = "image/png", UploadedAt = now.AddDays(-4).AddHours(1).AddMinutes(15) });
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t20.Id, UploadedBy = u5.Id, FileName = "certificate_order_confirmation.pdf", FilePath = $"uploads/{t20.Id}/certificate_order_confirmation.pdf", FileSizeBytes = 520000, MimeType = "application/pdf", UploadedAt = now.AddDays(-4).AddHours(4).AddMinutes(0) });
            // T23 - 4 attachments (all MIME types)
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t23.Id, UploadedBy = u10.Id, FileName = "zoom_error_message.jpg", FilePath = $"uploads/{t23.Id}/zoom_error_message.jpg", FileSizeBytes = 189000, MimeType = "image/jpeg", UploadedAt = now.AddDays(-3).AddHours(7).AddMinutes(15) });
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t23.Id, UploadedBy = u6.Id, FileName = "zoom_room_diagnostic_log.txt", FilePath = $"uploads/{t23.Id}/zoom_room_diagnostic_log.txt", FileSizeBytes = 32000, MimeType = "text/plain", UploadedAt = now.AddDays(-3).AddHours(8).AddMinutes(45) });
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t23.Id, UploadedBy = u6.Id, FileName = "driver_rollback_procedure.docx", FilePath = $"uploads/{t23.Id}/driver_rollback_procedure.docx", FileSizeBytes = 110000, MimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document", UploadedAt = now.AddDays(-3).AddHours(10).AddMinutes(15) });
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t23.Id, UploadedBy = u6.Id, FileName = "zoom_rooms_fix_animation.gif", FilePath = $"uploads/{t23.Id}/zoom_rooms_fix_animation.gif", FileSizeBytes = 5000000, MimeType = "image/gif", UploadedAt = now.AddDays(-3).AddHours(11).AddMinutes(30) });
            // T31 - 1 attachment
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t31.Id, UploadedBy = u4.Id, FileName = "kl_office_firewall_config.docx", FilePath = $"uploads/{t31.Id}/kl_office_firewall_config.docx", FileSizeBytes = 78000, MimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document", UploadedAt = now.AddDays(-1).AddHours(11).AddMinutes(45) });
            // T34 - 1 attachment
            attachments.Add(new TicketAttachment { Id = Guid.NewGuid(), TicketId = t34.Id, UploadedBy = u15.Id, FileName = "new_company_wallpaper.jpg", FilePath = $"uploads/{t34.Id}/new_company_wallpaper.jpg", FileSizeBytes = 1800000, MimeType = "image/jpeg", UploadedAt = now.AddDays(-3).AddHours(8).AddMinutes(15) });

            context.TicketAttachments.AddRange(attachments);

            // =========================================================
            // NOTIFICATIONS (28 entries - 15 read, 13 unread)
            // =========================================================
            var notifications = new List<Notification>();

            // Read notifications
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u4.Id, TicketId = t1.Id, Message = $"You have been assigned ticket {t1.ReferenceNumber}: {t1.Title}", IsRead = true, CreatedAt = now.AddDays(-2).AddHours(8).AddMinutes(30) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u10.Id, TicketId = t1.Id, Message = $"Your ticket {t1.ReferenceNumber} status changed to In Progress", IsRead = true, CreatedAt = now.AddDays(-2).AddHours(10) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u5.Id, TicketId = t3.Id, Message = $"You have been assigned ticket {t3.ReferenceNumber}: {t3.Title}", IsRead = true, CreatedAt = now.AddDays(-7).AddHours(9).AddMinutes(30) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u11.Id, TicketId = t3.Id, Message = $"Your ticket {t3.ReferenceNumber} status changed to Resolved", IsRead = true, CreatedAt = now.AddDays(-7).AddHours(10) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u4.Id, TicketId = t4.Id, Message = $"You have been assigned ticket {t4.ReferenceNumber}: {t4.Title}", IsRead = true, CreatedAt = now.AddDays(-30).AddHours(8).AddMinutes(30) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u8.Id, TicketId = t4.Id, Message = $"Your ticket {t4.ReferenceNumber} status changed to Resolved", IsRead = true, CreatedAt = now.AddDays(-29).AddHours(9) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u5.Id, TicketId = t15.Id, Message = $"You have been assigned ticket {t15.ReferenceNumber}: {t15.Title}", IsRead = true, CreatedAt = now.AddDays(-10).AddHours(6).AddMinutes(30) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u10.Id, TicketId = t15.Id, Message = $"Your ticket {t15.ReferenceNumber} status changed to Resolved", IsRead = true, CreatedAt = now.AddDays(-10).AddHours(9) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u4.Id, TicketId = t13.Id, Message = $"You have been assigned ticket {t13.ReferenceNumber}: {t13.Title}", IsRead = true, CreatedAt = now.AddDays(-5).AddHours(8).AddMinutes(30) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u6.Id, TicketId = t23.Id, Message = $"You have been assigned ticket {t23.ReferenceNumber}: {t23.Title}", IsRead = true, CreatedAt = now.AddDays(-3).AddHours(7).AddMinutes(30) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u4.Id, TicketId = t31.Id, Message = $"You have been assigned ticket {t31.ReferenceNumber}: {t31.Title}", IsRead = true, CreatedAt = now.AddDays(-2).AddHours(14).AddMinutes(30) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u5.Id, TicketId = t20.Id, Message = $"You have been assigned ticket {t20.ReferenceNumber}: {t20.Title}", IsRead = true, CreatedAt = now.AddDays(-4).AddHours(1).AddMinutes(30) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u6.Id, TicketId = t9.Id, Message = $"You have been assigned ticket {t9.ReferenceNumber}: {t9.Title}", IsRead = true, CreatedAt = now.AddDays(-2).AddHours(14) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u5.Id, TicketId = t9.Id, Message = $"Ticket {t9.ReferenceNumber} has been escalated to another agent per rule: High Priority Escalation", IsRead = true, CreatedAt = now.AddDays(-2).AddHours(14) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u4.Id, TicketId = t18.Id, Message = $"You have been assigned ticket {t18.ReferenceNumber}: {t18.Title}", IsRead = true, CreatedAt = now.AddDays(-15).AddHours(10).AddMinutes(30) });
            // Unread notifications
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u5.Id, TicketId = t7.Id, Message = $"You have been assigned ticket {t7.ReferenceNumber}: {t7.Title}", IsRead = false, CreatedAt = now.AddDays(-1).AddHours(14).AddMinutes(15) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u10.Id, TicketId = t7.Id, Message = $"New comment on ticket {t7.ReferenceNumber}", IsRead = false, CreatedAt = now.AddDays(0).AddHours(8).AddMinutes(30) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u12.Id, TicketId = t9.Id, Message = $"New comment on ticket {t9.ReferenceNumber}", IsRead = false, CreatedAt = now.AddDays(-2).AddHours(15) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u11.Id, TicketId = t10.Id, Message = $"Your ticket has been created: {t10.ReferenceNumber}: {t10.Title}", IsRead = false, CreatedAt = now.AddHours(9) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u6.Id, TicketId = t30.Id, Message = $"You have been assigned ticket {t30.ReferenceNumber}: {t30.Title}", IsRead = false, CreatedAt = now.AddHours(6).AddMinutes(55) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u10.Id, TicketId = t17.Id, Message = $"Your ticket {t17.ReferenceNumber} status changed to In Progress", IsRead = false, CreatedAt = now.AddDays(-1).AddHours(9) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u5.Id, TicketId = t6.Id, Message = $"New comment on ticket {t6.ReferenceNumber}", IsRead = false, CreatedAt = now.AddDays(-2).AddHours(11) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u4.Id, TicketId = t1.Id, Message = $"You were mentioned by Carol Agent on ticket {t1.ReferenceNumber}", IsRead = false, CreatedAt = now.AddDays(-1).AddHours(8) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u14.Id, TicketId = t27.Id, Message = $"Your ticket has been created: {t27.ReferenceNumber}: {t27.Title}", IsRead = false, CreatedAt = now.AddHours(8).AddMinutes(30) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u4.Id, TicketId = t12.Id, Message = $"You have been assigned ticket {t12.ReferenceNumber}: {t12.Title}", IsRead = false, CreatedAt = now.AddDays(0).AddHours(14).AddMinutes(15) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u10.Id, TicketId = t30.Id, Message = $"Your ticket has been created: {t30.ReferenceNumber}: {t30.Title}", IsRead = false, CreatedAt = now.AddHours(6).AddMinutes(45) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u15.Id, TicketId = t33.Id, Message = $"Your ticket has been created: {t33.ReferenceNumber}: {t33.Title}", IsRead = false, CreatedAt = now.AddHours(10) });
            notifications.Add(new Notification { Id = Guid.NewGuid(), UserId = u4.Id, TicketId = t28.Id, Message = $"New comment on ticket {t28.ReferenceNumber}", IsRead = false, CreatedAt = now.AddDays(-2).AddHours(11).AddMinutes(30) });

            context.Notifications.AddRange(notifications);

            // =========================================================
            // ACTIVITY LOGS (65 entries)
            // =========================================================
            var activityLogs = new List<ActivityLog>();

            // User creation logs (14)
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "UserCreated", EntityType = "User", EntityId = u2.Id, Metadata = "{\"role\":\"Admin\"}", PerformedAt = now.AddDays(-170) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "UserCreated", EntityType = "User", EntityId = u3.Id, Metadata = "{\"role\":\"Admin\"}", PerformedAt = now.AddDays(-160) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "UserCreated", EntityType = "User", EntityId = u4.Id, Metadata = "{\"role\":\"Agent\"}", PerformedAt = now.AddDays(-150) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "UserCreated", EntityType = "User", EntityId = u5.Id, Metadata = "{\"role\":\"Agent\"}", PerformedAt = now.AddDays(-145) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u2.Id, Action = "UserCreated", EntityType = "User", EntityId = u7.Id, Metadata = "{\"role\":\"Agent\"}", PerformedAt = now.AddDays(-140) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "UserCreated", EntityType = "User", EntityId = u8.Id, Metadata = "{\"role\":\"Manager\"}", PerformedAt = now.AddDays(-135) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "UserCreated", EntityType = "User", EntityId = u9.Id, Metadata = "{\"role\":\"Manager\"}", PerformedAt = now.AddDays(-130) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u2.Id, Action = "UserCreated", EntityType = "User", EntityId = u10.Id, Metadata = "{\"role\":\"Employee\"}", PerformedAt = now.AddDays(-120) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u2.Id, Action = "UserCreated", EntityType = "User", EntityId = u11.Id, Metadata = "{\"role\":\"Employee\"}", PerformedAt = now.AddDays(-110) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u2.Id, Action = "UserCreated", EntityType = "User", EntityId = u13.Id, Metadata = "{\"role\":\"Employee\"}", PerformedAt = now.AddDays(-100) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u2.Id, Action = "UserCreated", EntityType = "User", EntityId = u14.Id, Metadata = "{\"role\":\"Employee\"}", PerformedAt = now.AddDays(-50) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "UserCreated", EntityType = "User", EntityId = u15.Id, Metadata = "{\"role\":\"Employee\"}", PerformedAt = now.AddDays(-30) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u2.Id, Action = "UserCreated", EntityType = "User", EntityId = u12.Id, Metadata = "{\"role\":\"Employee\"}", PerformedAt = now.AddDays(-10) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "UserCreated", EntityType = "User", EntityId = u6.Id, Metadata = "{\"role\":\"Agent\"}", PerformedAt = now.AddDays(-20) });
            // User role change
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "UserRoleChanged", EntityType = "User", EntityId = u7.Id, Metadata = "{\"newRole\":\"Agent\"}", PerformedAt = now.AddDays(-140) });
            // User deactivation/activation
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "UserDeactivated", EntityType = "User", EntityId = u3.Id, Metadata = "{}", PerformedAt = now.AddDays(-30) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "UserDeactivated", EntityType = "User", EntityId = u13.Id, Metadata = "{}", PerformedAt = now.AddDays(-50) });
            // Ticket creation logs (35)
            foreach (var t in allTickets)
            {
                activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = t.CreatedBy, Action = "TicketCreated", EntityType = "Ticket", EntityId = t.Id, Metadata = "{}", PerformedAt = t.CreatedAt });
            }
            // Status change logs (from history - select a few)
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u4.Id, Action = "STATUS_CHANGED", EntityType = "Ticket", EntityId = t1.Id, Metadata = "{\"from\":1,\"to\":2}", PerformedAt = now.AddDays(-2).AddHours(10) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u5.Id, Action = "STATUS_CHANGED", EntityType = "Ticket", EntityId = t15.Id, Metadata = "{\"from\":1,\"to\":2}", PerformedAt = now.AddDays(-10).AddHours(7) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u5.Id, Action = "STATUS_CHANGED", EntityType = "Ticket", EntityId = t15.Id, Metadata = "{\"from\":2,\"to\":3}", PerformedAt = now.AddDays(-10).AddHours(9) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u7.Id, Action = "STATUS_CHANGED", EntityType = "Ticket", EntityId = t17.Id, Metadata = "{\"from\":3,\"to\":2}", PerformedAt = now.AddDays(-1).AddHours(9) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u4.Id, Action = "STATUS_CHANGED", EntityType = "Ticket", EntityId = t29.Id, Metadata = "{\"from\":1,\"to\":2}", PerformedAt = now.AddDays(-4).AddHours(15) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u10.Id, Action = "STATUS_CHANGED", EntityType = "Ticket", EntityId = t11.Id, Metadata = "{\"from\":1,\"to\":5}", PerformedAt = now.AddDays(-4).AddHours(14) });
            // Assignment logs (select a few)
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "TICKET_ASSIGNED", EntityType = "Ticket", EntityId = t1.Id, Metadata = "{\"assignedTo\":\"" + u4.Id + "\"}", PerformedAt = now.AddDays(-2).AddHours(8).AddMinutes(30) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "TICKET_ASSIGNED", EntityType = "Ticket", EntityId = t9.Id, Metadata = "{\"assignedTo\":\"" + u6.Id + "\"}", PerformedAt = now.AddDays(-2).AddHours(14) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "TICKET_UNASSIGNED", EntityType = "Ticket", EntityId = t25.Id, Metadata = "{}", PerformedAt = now.AddDays(-15).AddHours(14) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "TICKET_ASSIGNED", EntityType = "Ticket", EntityId = t25.Id, Metadata = "{\"assignedTo\":\"" + u7.Id + "\"}", PerformedAt = now.AddDays(-15).AddHours(16) });
            // Ticket auto-assigned logs
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "TICKET_AUTO_ASSIGNED", EntityType = "Ticket", EntityId = t3.Id, Metadata = "{}", PerformedAt = now.AddDays(-7).AddHours(9).AddMinutes(30) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "TICKET_AUTO_ASSIGNED", EntityType = "Ticket", EntityId = t13.Id, Metadata = "{}", PerformedAt = now.AddDays(-5).AddHours(8).AddMinutes(30) });
            // Escalation log
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "TICKET_ESCALATED", EntityType = "Ticket", EntityId = t9.Id, Metadata = "{\"rule\":\"High Priority Escalation\",\"fromAgent\":\"" + u4.Id + "\",\"toAgent\":\"" + u5.Id + "\"}", PerformedAt = now.AddDays(-2).AddHours(8) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "TICKET_ESCALATED", EntityType = "Ticket", EntityId = t9.Id, Metadata = "{\"rule\":\"Critical Auto-Escalate\",\"fromAgent\":\"" + u5.Id + "\",\"toAgent\":\"" + u6.Id + "\"}", PerformedAt = now.AddDays(-2).AddHours(14) });
            // Comment logs (select a few)
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u4.Id, Action = "COMMENT_ADDED", EntityType = "Ticket", EntityId = t1.Id, Metadata = "{\"isInternal\":false}", PerformedAt = now.AddDays(-2).AddHours(8).AddMinutes(45) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u4.Id, Action = "COMMENT_ADDED", EntityType = "Ticket", EntityId = t1.Id, Metadata = "{\"isInternal\":true}", PerformedAt = now.AddDays(-2).AddHours(9).AddMinutes(15) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u5.Id, Action = "COMMENT_ADDED", EntityType = "Ticket", EntityId = t15.Id, Metadata = "{\"isInternal\":false}", PerformedAt = now.AddDays(-10).AddHours(7).AddMinutes(30) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u10.Id, Action = "COMMENT_ADDED", EntityType = "Ticket", EntityId = t17.Id, Metadata = "{\"isInternal\":false}", PerformedAt = now.AddDays(-1).AddHours(9) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u5.Id, Action = "COMMENT_ADDED", EntityType = "Ticket", EntityId = t20.Id, Metadata = "{\"isInternal\":true}", PerformedAt = now.AddDays(-4).AddHours(4).AddMinutes(30) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u6.Id, Action = "COMMENT_ADDED", EntityType = "Ticket", EntityId = t23.Id, Metadata = "{\"isInternal\":false}", PerformedAt = now.AddDays(-3).AddHours(8).AddMinutes(30) });
            // Attachment logs
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u10.Id, Action = "ATTACHMENT_UPLOADED", EntityType = "Ticket", EntityId = t1.Id, Metadata = "{\"fileName\":\"server_room_temp_reading.jpg\",\"fileSize\":245000,\"mimeType\":\"image/jpeg\"}", PerformedAt = now.AddDays(-2).AddHours(8).AddMinutes(15) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u4.Id, Action = "ATTACHMENT_UPLOADED", EntityType = "Ticket", EntityId = t1.Id, Metadata = "{\"fileName\":\"ac_error_code_E47_reference.pdf\",\"fileSize\":420000,\"mimeType\":\"application/pdf\"}", PerformedAt = now.AddDays(-2).AddHours(9) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u6.Id, Action = "ATTACHMENT_UPLOADED", EntityType = "Ticket", EntityId = t23.Id, Metadata = "{\"fileName\":\"zoom_rooms_fix_animation.gif\",\"fileSize\":5000000,\"mimeType\":\"image/gif\"}", PerformedAt = now.AddDays(-3).AddHours(11).AddMinutes(30) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u4.Id, Action = "ATTACHMENT_UPLOADED", EntityType = "Ticket", EntityId = t31.Id, Metadata = "{\"fileName\":\"kl_office_firewall_config.docx\",\"fileSize\":78000,\"mimeType\":\"application/vnd.openxmlformats-officedocument.wordprocessingml.document\"}", PerformedAt = now.AddDays(-1).AddHours(11).AddMinutes(45) });
            // Ticket update logs
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u4.Id, Action = "TicketUpdated", EntityType = "Ticket", EntityId = t9.Id, Metadata = "{}", PerformedAt = now.AddDays(-2).AddHours(14) });
            activityLogs.Add(new ActivityLog { Id = Guid.NewGuid(), UserId = u1.Id, Action = "TicketUpdated", EntityType = "Ticket", EntityId = t26.Id, Metadata = "{}", PerformedAt = now.AddDays(-6).AddHours(10) });

            context.ActivityLogs.AddRange(activityLogs);

            // =========================================================
            // SYSTEM SETTINGS (8)
            // =========================================================
            context.SystemSettings.AddRange(
                new SystemSetting { Key = "slaEnabled", Value = "true", UpdatedAt = now.AddDays(-60) },
                new SystemSetting { Key = "autoAssign", Value = "true", UpdatedAt = now.AddDays(-60) },
                new SystemSetting { Key = "companyName", Value = "IDS Corp", UpdatedAt = now.AddDays(-60) },
                new SystemSetting { Key = "supportEmail", Value = "support@idscorp.com", UpdatedAt = now.AddDays(-60) },
                new SystemSetting { Key = "timezone", Value = "Asia/Singapore", UpdatedAt = now.AddDays(-60) },
                new SystemSetting { Key = "maxLoginAttempts", Value = "5", UpdatedAt = now.AddDays(-60) },
                new SystemSetting { Key = "maintenanceMode", Value = "false", UpdatedAt = now.AddDays(-30) },
                new SystemSetting { Key = "maxAttachmentsPerTicket", Value = "5", UpdatedAt = now.AddDays(-30) }
            );

            // =========================================================
            // ESCALATION RULES (5)
            // =========================================================
            context.EscalationRules.AddRange(
                new EscalationRule { Name = "Critical Auto-Escalate", PriorityId = 4, TriggerHours = 2, TargetRoleId = 2, EscalateToRoleId = 1, IsActive = true },
                new EscalationRule { Name = "High Priority Escalation", PriorityId = 3, TriggerHours = 6, TargetRoleId = 2, EscalateToRoleId = 3, IsActive = true },
                new EscalationRule { Name = "Medium Overdue Escalation", PriorityId = 2, TriggerHours = 18, TargetRoleId = 2, EscalateToRoleId = 3, IsActive = true },
                new EscalationRule { Name = "Old Low Priority Review", PriorityId = 1, TriggerHours = 48, TargetRoleId = 2, EscalateToRoleId = 2, IsActive = false },
                new EscalationRule { Name = "Critical Unassigned Alert", PriorityId = 4, TriggerHours = 1, TargetRoleId = null, EscalateToRoleId = 2, IsActive = true }
            );

            // =========================================================
            // REFRESH TOKENS (5)
            // =========================================================
            var refreshTokenHasher = SHA256.Create();
            context.RefreshTokens.AddRange(
                new RefreshToken { Id = Guid.NewGuid(), UserId = u1.Id, TokenHash = Convert.ToHexString(refreshTokenHasher.ComputeHash(Encoding.UTF8.GetBytes("valid-token-admin"))), ExpiresAt = now.AddDays(30), CreatedAt = now },
                new RefreshToken { Id = Guid.NewGuid(), UserId = u4.Id, TokenHash = Convert.ToHexString(refreshTokenHasher.ComputeHash(Encoding.UTF8.GetBytes("valid-token-bob"))), ExpiresAt = now.AddDays(30), CreatedAt = now },
                new RefreshToken { Id = Guid.NewGuid(), UserId = u10.Id, TokenHash = Convert.ToHexString(refreshTokenHasher.ComputeHash(Encoding.UTF8.GetBytes("expired-token-diana"))), ExpiresAt = now.AddDays(-1), CreatedAt = now.AddDays(-31) },
                new RefreshToken { Id = Guid.NewGuid(), UserId = u5.Id, TokenHash = Convert.ToHexString(refreshTokenHasher.ComputeHash(Encoding.UTF8.GetBytes("revoked-token-carol"))), ExpiresAt = now.AddDays(30), CreatedAt = now.AddDays(-5), RevokedAt = now.AddDays(-3) },
                new RefreshToken { Id = Guid.NewGuid(), UserId = u8.Id, TokenHash = Convert.ToHexString(refreshTokenHasher.ComputeHash(Encoding.UTF8.GetBytes("replaced-token-eve"))), ExpiresAt = now.AddDays(30), CreatedAt = now.AddDays(-5), ReplacedByHash = Convert.ToHexString(refreshTokenHasher.ComputeHash(Encoding.UTF8.GetBytes("new-token-eve"))) }
            );

            // =========================================================
            // PASSWORD RESET TOKEN (1 - Diana)
            // =========================================================
            var dianaUser = await context.Users.FirstAsync(u => u.Email == "diana@test.com");
            var resetTokenBytes = RandomNumberGenerator.GetBytes(32);
            dianaUser.PasswordResetToken = Convert.ToHexString(resetTokenBytes);
            dianaUser.PasswordResetTokenExpiry = now.AddHours(24);

            await context.SaveChangesAsync();
        }
    }
}
