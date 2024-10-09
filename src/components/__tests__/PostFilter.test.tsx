import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import PostFilter from '../PostFilter';

describe('PostFilter', () => {
  it('calls onCategoryChange when category is selected', () => {
    const mockOnCategoryChange = jest.fn();
    const mockOnViewModeChange = jest.fn();
    const { getByRole } = render(
      <PostFilter 
        onCategoryChange={mockOnCategoryChange} 
        onViewModeChange={mockOnViewModeChange}
        currentViewMode="grid"
      />
    );

    fireEvent.change(getByRole('combobox'), { target: { value: 'programming' } });
    expect(mockOnCategoryChange).toHaveBeenCalledWith('programming');
  });

  it('calls onViewModeChange when view mode is changed', () => {
    const mockOnCategoryChange = jest.fn();
    const mockOnViewModeChange = jest.fn();
    const { getByLabelText } = render(
      <PostFilter 
        onCategoryChange={mockOnCategoryChange} 
        onViewModeChange={mockOnViewModeChange}
        currentViewMode="grid"
      />
    );

    fireEvent.click(getByLabelText('List view'));
    expect(mockOnViewModeChange).toHaveBeenCalledWith('list');
  });
});