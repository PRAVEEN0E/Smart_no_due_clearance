import { render, screen, fireEvent } from '@testing-library/react';
import MentorTable from '../components/mentor/MentorTable';
import { BrowserRouter } from 'react-router-dom';

const defaultProps = {
    activeTab: 'students',
    setActiveTab: () => {},
    searchQuery: '',
    getFilteredData: [],
    user: { role: 'MENTOR' },
    onAddClick: () => {},
    onEditClick: () => {},
    onDeleteItem: () => {},
    onToggleFee: () => {},
    onEnrollStudent: () => {},
    onCustomClearance: () => {},
    onAssignStaff: () => {},
    onAuditLog: () => {},
    onSearch: () => {},
    studentPage: 1,
    studentTotal: 50,
    studentTotalPages: 5,
    onPageChange: () => {},
    filterFeeStatus: 'all',
    onFilterChange: () => {},
    onRestoreItem: () => {},
};

function renderTable(props = {}) {
    return render(
        <BrowserRouter>
            <MentorTable {...defaultProps} {...props} />
        </BrowserRouter>
    );
}

describe('MentorTable', () => {
    it('renders tab navigation with all tabs', () => {
        renderTable();
        expect(screen.getByRole('button', { name: /add students/i })).toBeInTheDocument();
        const allText = document.body.textContent;
        expect(allText).toContain('Students');
        expect(allText).toContain('Staff');
        expect(allText).toContain('Workflow');
        expect(allText).toContain('Audit');
    });

    it('shows record count for students tab', () => {
        renderTable();
        expect(screen.getByText(/50 Records found/)).toBeInTheDocument();
    });

    it('shows pagination info when multiple pages', () => {
        renderTable({ studentTotalPages: 5 });
        expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();
    });

    it('calls setActiveTab when clicking staff tab', () => {
        const setActiveTab = vi.fn();
        const { container } = renderTable({ setActiveTab, activeTab: 'students' });
        const staffTab = [...container.querySelectorAll('button')].find(b => b.textContent === 'Staff');
        expect(staffTab).toBeTruthy();
        fireEvent.click(staffTab);
        expect(setActiveTab).toHaveBeenCalledWith('staff');
    });

    it('calls onPageChange when clicking next page', () => {
        const onPageChange = vi.fn();
        renderTable({ onPageChange, studentTotalPages: 5 });
        const nextButton = screen.getByLabelText('Next page');
        fireEvent.click(nextButton);
        expect(onPageChange).toHaveBeenCalled();
    });

    it('renders fee status filter dropdown', () => {
        renderTable();
        const select = screen.getByLabelText('Fee status filter');
        expect(select).toBeInTheDocument();
        expect(select.value).toBe('all');
    });

    it('calls onFilterChange when fee filter changes', () => {
        const onFilterChange = vi.fn();
        renderTable({ onFilterChange });
        const select = screen.getByLabelText('Fee status filter');
        fireEvent.change(select, { target: { value: 'cleared' } });
        expect(onFilterChange).toHaveBeenCalledWith({ feeStatus: 'cleared' });
    });

    it('renders search input with placeholder', () => {
        renderTable();
        const input = screen.getByPlaceholderText('Filter students...');
        expect(input).toBeInTheDocument();
    });

    it('calls onSearch when typing in search', () => {
        const onSearch = vi.fn();
        renderTable({ onSearch });
        const input = screen.getByPlaceholderText('Filter students...');
        fireEvent.change(input, { target: { value: 'arjun' } });
        expect(onSearch).toHaveBeenCalledWith('arjun');
    });

    it('does not show pagination with single page', () => {
        renderTable({ studentTotalPages: 1 });
        expect(screen.queryByText(/Page 1 of 1/)).not.toBeInTheDocument();
    });

    it('hides fee filter on non-student tabs', () => {
        renderTable({ activeTab: 'staff' });
        expect(screen.queryByLabelText('Fee status filter')).not.toBeInTheDocument();
    });
});
