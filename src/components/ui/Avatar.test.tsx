import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Avatar from './Avatar';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onError, ...props }: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img src={src} alt={alt} onError={onError} {...props} />;
  },
}));

describe('Avatar Component', () => {
  it('should display initials when no image is provided', () => {
    render(<Avatar name="John Doe" size="md" />);
    
    const avatar = screen.getByText('JD');
    expect(avatar).toBeInTheDocument();
    expect(avatar.className).toContain('bg-blue-100');
    expect(avatar.className).toContain('text-blue-600');
  });

  it('should display custom image when provided', () => {
    render(
      <Avatar 
        src="/custom-avatar.jpg" 
        name="Jane Smith" 
        size="md" 
      />
    );
    
    const img = screen.getByAltText('Jane Smith avatar');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/custom-avatar.jpg');
  });

  it('should display Google image when no custom image but Google image exists', () => {
    render(
      <Avatar 
        googleSrc="https://lh3.googleusercontent.com/user123" 
        name="Bob Johnson" 
        size="md" 
      />
    );
    
    const img = screen.getByAltText('Bob Johnson avatar');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://lh3.googleusercontent.com/user123');
  });

  it('should prioritize custom image over Google image', () => {
    render(
      <Avatar 
        src="/custom.jpg"
        googleSrc="https://lh3.googleusercontent.com/user123" 
        name="Alice Brown" 
        size="md" 
      />
    );
    
    const img = screen.getByAltText('Alice Brown avatar');
    expect(img).toHaveAttribute('src', '/custom.jpg');
  });

  it('should handle image load error and fall back to initials', () => {
    const { rerender } = render(
      <Avatar 
        src="/broken-image.jpg" 
        name="Error Test" 
        size="md" 
      />
    );

    const img = screen.getByAltText('Error Test avatar');
    
    // Simulate image error
    fireEvent.error(img);
    
    // Force re-render to see the fallback
    rerender(
      <Avatar 
        src="/broken-image.jpg" 
        name="Error Test" 
        size="md" 
      />
    );

    // After error, component should show initials instead
    expect(screen.queryByAltText('Error Test avatar')).not.toBeInTheDocument();
  });

  it('should apply correct size classes', () => {
    const { rerender } = render(<Avatar name="Size Test" size="xs" />);
    let avatar = screen.getByText('ST');
    expect(avatar.className).toContain('w-6 h-6 text-xs');

    rerender(<Avatar name="Size Test" size="sm" />);
    avatar = screen.getByText('ST');
    expect(avatar.className).toContain('w-8 h-8 text-sm');

    rerender(<Avatar name="Size Test" size="lg" />);
    avatar = screen.getByText('ST');
    expect(avatar.className).toContain('w-12 h-12 text-lg');

    rerender(<Avatar name="Size Test" size="xl" />);
    avatar = screen.getByText('ST');
    expect(avatar.className).toContain('w-16 h-16 text-xl');
  });

  it('should handle single word names', () => {
    render(<Avatar name="Madonna" size="md" />);
    const avatar = screen.getByText('M');
    expect(avatar).toBeInTheDocument();
  });

  it('should handle names with multiple spaces', () => {
    render(<Avatar name="John   Paul   Jones" size="md" />);
    const avatar = screen.getByText('JP');
    expect(avatar).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <Avatar 
        name="Custom Class" 
        size="md" 
        className="border-2 border-red-500" 
      />
    );
    
    const avatar = screen.getByText('CC');
    expect(avatar.className).toContain('border-2');
    expect(avatar.className).toContain('border-red-500');
  });
});