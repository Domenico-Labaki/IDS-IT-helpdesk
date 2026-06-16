using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSlaTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "SlaBreachedAt",
                table: "Tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SlaDeadline",
                table: "Tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SlaTargets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PriorityId = table.Column<int>(type: "integer", nullable: false),
                    TargetHours = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlaTargets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SlaTargets_Priorities_PriorityId",
                        column: x => x.PriorityId,
                        principalTable: "Priorities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 16, 9, 6, 47, 50, DateTimeKind.Utc).AddTicks(7919));

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 2,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 16, 9, 6, 47, 50, DateTimeKind.Utc).AddTicks(7922));

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 3,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 16, 9, 6, 47, 50, DateTimeKind.Utc).AddTicks(7924));

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 4,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 16, 9, 6, 47, 50, DateTimeKind.Utc).AddTicks(7926));

            migrationBuilder.InsertData(
                table: "SlaTargets",
                columns: new[] { "Id", "PriorityId", "TargetHours" },
                values: new object[,]
                {
                    { 1, 1, 72 },
                    { 2, 2, 24 },
                    { 3, 3, 8 },
                    { 4, 4, 4 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_SlaTargets_PriorityId",
                table: "SlaTargets",
                column: "PriorityId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SlaTargets");

            migrationBuilder.DropColumn(
                name: "SlaBreachedAt",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "SlaDeadline",
                table: "Tickets");

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 15, 21, 26, 12, 20, DateTimeKind.Utc).AddTicks(7024));

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 2,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 15, 21, 26, 12, 20, DateTimeKind.Utc).AddTicks(7027));

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 3,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 15, 21, 26, 12, 20, DateTimeKind.Utc).AddTicks(7029));

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 4,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 15, 21, 26, 12, 20, DateTimeKind.Utc).AddTicks(7030));
        }
    }
}
