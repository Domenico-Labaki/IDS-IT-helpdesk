using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSettingsAndEmailTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmailTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Subject = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Key = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "EmailTemplates",
                columns: new[] { "Id", "Body", "Name", "Subject", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, "<p>Hello {Name},</p><p>Your ticket has been created successfully.</p><p><strong>{ReferenceNumber}</strong> — {Title}</p><p><a href=\"{TicketUrl}\">View your ticket</a></p>", "New Ticket Created", "[{ReferenceNumber}] Ticket Created — IT Help Desk", new DateTime(2026, 6, 15, 21, 26, 12, 20, DateTimeKind.Utc).AddTicks(7024) },
                    { 2, "<p>Hello {Name},</p><p>Ticket <strong>{ReferenceNumber}</strong> has been assigned to you.</p><p>{Title}</p><p><a href=\"{TicketUrl}\">View assigned ticket</a></p>", "Ticket Assigned", "[{ReferenceNumber}] Ticket Assigned — IT Help Desk", new DateTime(2026, 6, 15, 21, 26, 12, 20, DateTimeKind.Utc).AddTicks(7027) },
                    { 3, "<p>Hello {Name},</p><p>Your ticket <strong>{ReferenceNumber}</strong> status has changed to <strong>{NewStatus}</strong>.</p><p>{Title}</p><p><a href=\"{TicketUrl}\">View your ticket</a></p>", "Ticket Updated", "[{ReferenceNumber}] Status Updated — IT Help Desk", new DateTime(2026, 6, 15, 21, 26, 12, 20, DateTimeKind.Utc).AddTicks(7029) },
                    { 4, "<p>Hello {Name},</p><p>Your ticket <strong>{ReferenceNumber}</strong> has been resolved.</p><p>{Title}</p><p><a href=\"{TicketUrl}\">View your ticket</a></p>", "Ticket Resolved", "[{ReferenceNumber}] Ticket Resolved — IT Help Desk", new DateTime(2026, 6, 15, 21, 26, 12, 20, DateTimeKind.Utc).AddTicks(7030) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailTemplates");

            migrationBuilder.DropTable(
                name: "SystemSettings");
        }
    }
}
