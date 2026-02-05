import { z } from 'zod';
import { SkillDefinition, SkillResult } from '../../types';

export const ComponentTestBuilderSchema = z.object({
    componentName: z.string().describe('Name of the component to test, e.g. Button'),
    props: z.record(z.string(), z.any()).default({}).describe('Default props to pass to the component'),

    testScenarios: z.array(z.enum(['render', 'click', 'disabled', 'accessibility'])).default(['render', 'accessibility']).describe('Test scenarios to generate'),
});

const handler = async (args: z.infer<typeof ComponentTestBuilderSchema>): Promise<SkillResult> => {
    const { componentName, props, testScenarios } = args;

    const imports = `import { render, screen, fireEvent } from '@testing-library/react';
import { ${componentName} } from './${componentName}';
import '@testing-library/jest-dom';`;

    const tests = testScenarios.map(scenario => {
        switch (scenario) {
            case 'render':
                return `
  it('renders correctly', () => {
    render(<${componentName} ${formatProps(props)} />);
    expect(screen.getByRole('button')).toBeInTheDocument(); // Adjust role as needed
  });`;
            case 'click':
                return `
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<${componentName} ${formatProps(props)} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });`;
            case 'disabled':
                return `
  it('is disabled when prop is passed', () => {
    render(<${componentName} ${formatProps(props)} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });`;
            case 'accessibility':
                return `
  it('has accessible name', () => {
    render(<${componentName} ${formatProps(props)} />);
    expect(screen.getByRole('button', { name: /${props.label || componentName}/i })).toBeInTheDocument();
  });`;
            default: return '';
        }
    }).join('\n');

    const code = `${imports}

describe('${componentName}', () => {
${tests}
});
`;

    return {
        success: true,
        data: code,
        metadata: {
            library: 'react-testing-library',
            testEnvironment: 'jsdom'
        }
    };
};

function formatProps(props: Record<string, any>): string {
    return Object.entries(props).map(([key, val]) => {
        if (typeof val === 'string') return `${key}="${val}"`;
        if (val === true) return key;
        return `${key}={${JSON.stringify(val)}}`;
    }).join(' ');
}

export const componentTestBuilderSkillDefinition: SkillDefinition<typeof ComponentTestBuilderSchema> = {
    name: 'component_test_builder',
    description: 'Generates React Testing Library tests for UI components.',
    parameters: ComponentTestBuilderSchema,
    handler,
};
