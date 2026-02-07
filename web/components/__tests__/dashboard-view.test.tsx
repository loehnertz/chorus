import { render, screen } from '@testing-library/react'
import { DashboardView } from '@/components/dashboard-view'

describe('DashboardView', () => {
  it('shows an empty state for no tasks', () => {
    render(
      <DashboardView
        userId="u1"
        stats={{ completedTotal: 0, completedThisWeek: 0, streakDays: 0, choresCount: 0 }}
        todaysTasks={[]}
        recentActivity={[]}
      />
    )

    expect(screen.getByText("Today's Tasks")).toBeInTheDocument()
    expect(screen.getByText('All clear!')).toBeInTheDocument()
  })
})
