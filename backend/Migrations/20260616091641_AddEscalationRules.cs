using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddEscalationRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EscalationRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PriorityId = table.Column<int>(type: "integer", nullable: false),
                    TriggerHours = table.Column<int>(type: "integer", nullable: false),
                    TargetRoleId = table.Column<int>(type: "integer", nullable: true),
                    EscalateToRoleId = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EscalationRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EscalationRules_Priorities_PriorityId",
                        column: x => x.PriorityId,
                        principalTable: "Priorities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EscalationRules_Roles_EscalateToRoleId",
                        column: x => x.EscalateToRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_EscalationRules_Roles_TargetRoleId",
                        column: x => x.TargetRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 1,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 16, 9, 16, 40, 875, DateTimeKind.Utc).AddTicks(2213));

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 2,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 16, 9, 16, 40, 875, DateTimeKind.Utc).AddTicks(2216));

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 3,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 16, 9, 16, 40, 875, DateTimeKind.Utc).AddTicks(2218));

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: 4,
                column: "UpdatedAt",
                value: new DateTime(2026, 6, 16, 9, 16, 40, 875, DateTimeKind.Utc).AddTicks(2220));

            migrationBuilder.CreateIndex(
                name: "IX_EscalationRules_EscalateToRoleId",
                table: "EscalationRules",
                column: "EscalateToRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_EscalationRules_PriorityId",
                table: "EscalationRules",
                column: "PriorityId");

            migrationBuilder.CreateIndex(
                name: "IX_EscalationRules_TargetRoleId",
                table: "EscalationRules",
                column: "TargetRoleId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EscalationRules");

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
        }
    }
}
