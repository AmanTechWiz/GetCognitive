import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServerCodeBlock } from '@/components/codeblock';

describe('ServerCodeBlock', () => {
  it('renders code content', () => {
    render(<ServerCodeBlock code="const x = 1;" lang="ts" />);
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('renders the language as a data attribute', () => {
    const { container } = render(<ServerCodeBlock code="print('hello')" lang="python" />);
    const code = container.querySelector('code');
    expect(code).toHaveAttribute('data-lang', 'python');
  });

  it('renders a title bar when title is provided', () => {
    render(
      <ServerCodeBlock code="npm install" lang="bash" codeblock={{ title: 'Installation' }} />,
    );
    expect(screen.getByText('Installation')).toBeInTheDocument();
  });

  it('does not render a title bar when title is omitted', () => {
    const { container } = render(<ServerCodeBlock code="x = 1" lang="python" />);
    // The title div has a border-b class; it should not be present
    expect(container.querySelector('.border-b')).not.toBeInTheDocument();
  });

  it('applies custom className to the wrapper', () => {
    const { container } = render(
      <ServerCodeBlock code="x" codeblock={{ className: 'my-custom-class' }} />,
    );
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('renders a <pre> with overflow-auto', () => {
    const { container } = render(<ServerCodeBlock code="x" />);
    const pre = container.querySelector('pre');
    expect(pre).toHaveClass('overflow-auto');
  });

  it('renders without lang attribute gracefully', () => {
    const { container } = render(<ServerCodeBlock code="plain text" />);
    const code = container.querySelector('code');
    expect(code).not.toHaveAttribute('data-lang');
  });
});
