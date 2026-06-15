namespace HelpdeskApi.DTOs
{
    public class DashboardStatsDto
    {
        // Employee
        public int TotalCreated { get; set; }
        public int OpenCount { get; set; }
        public int ResolvedCount { get; set; }

        // Agent
        public int TotalAssigned { get; set; }
        public int InProgressCount { get; set; }

        // Manager / Admin
        public int TotalTickets { get; set; }
        public int ClosedCount { get; set; }
        public int CancelledCount { get; set; }
        public int UnassignedCount { get; set; }
        public int CreatedTodayCount { get; set; }
    }
}
