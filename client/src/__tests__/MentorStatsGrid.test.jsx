import { render, screen } from '@testing-library/react';
import MentorStatsGrid from '../components/mentor/MentorStatsGrid';

describe('MentorStatsGrid', () => {
    const defaultStats = {
        studentCount: 42,
        staffCount: 8,
        subjectCount: 15,
        totalApprovals: 120,
        hallTicketsReady: 30,
        hallTicketsBlocked: 12,
        feesPending: 5,
        pendingClearance: 7,
    };

    it('renders all 8 stat cards', () => {
        render(<MentorStatsGrid stats={defaultStats} />);
        expect(screen.getByText('Total Students')).toBeInTheDocument();
        expect(screen.getByText('Staff Members')).toBeInTheDocument();
        expect(screen.getByText('Total Subjects')).toBeInTheDocument();
        expect(screen.getByText('Total Approvals')).toBeInTheDocument();
        expect(screen.getByText('Hall Tickets Ready')).toBeInTheDocument();
        expect(screen.getByText('Hall Tickets Blocked')).toBeInTheDocument();
        expect(screen.getByText('Fees Pending')).toBeInTheDocument();
        expect(screen.getByText('Pending Clearance')).toBeInTheDocument();
    });

    it('displays correct values', () => {
        render(<MentorStatsGrid stats={defaultStats} />);
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('120')).toBeInTheDocument();
    });

    it('displays 0 for undefined values', () => {
        render(<MentorStatsGrid stats={{}} />);
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBe(8);
    });

    it('renders with undefined stats gracefully', () => {
        render(<MentorStatsGrid />);
        const zeros = screen.getAllByText('0');
        expect(zeros.length).toBe(8);
    });
});
