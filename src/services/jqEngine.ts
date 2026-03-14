import type { TransformResult, ValidationResult } from '../types';

export class JQService {
  private jq: any = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamically import jq-web
      const jqModule = await import('jq-web');
      this.jq = await jqModule.default();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize JQ:', error);
      throw error;
    }
  }

  async transform(expression: string, inputData: any): Promise<TransformResult> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      // jq-web returns result directly (synchronous)
      // Usage: jq.json(input, filter)
      console.log('JQ Transform - Input:', inputData);
      console.log('JQ Transform - Expression:', expression);

      const result = this.jq.json(inputData, expression);
      console.log('JQ Transform - Result:', result);

      return { success: true, output: result };
    } catch (error: any) {
      console.error('JQ Transform Error:', error);
      return {
        success: false,
        error: this.parseJQError(error),
        suggestions: this.getSuggestions(error),
      };
    }
  }

  async validate(expression: string): Promise<ValidationResult> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      // Test with empty object
      this.jq.json({}, expression);
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: this.parseJQError(error),
        suggestions: this.getSuggestions(error),
      };
    }
  }

  private parseJQError(error: any): string {
    const message = error.message || error.toString();
    return message.replace(/jq: error:?/gi, '').trim();
  }

  private getSuggestions(error: any): string[] {
    const suggestions: string[] = [];
    const message = (error.message || '').toLowerCase();

    if (message.includes('undefined') || message.includes('null')) {
      suggestions.push('Check if all field paths exist in your input data');
      suggestions.push('Use the // operator for default values: .field // "default"');
    }

    if (message.includes('syntax') || message.includes('parse')) {
      suggestions.push(
        'Verify JQ syntax - common issues: missing pipes |, parentheses, or brackets'
      );
      suggestions.push('Check for unmatched quotes or brackets');
    }

    if (message.includes('cannot iterate')) {
      suggestions.push('Make sure you are iterating over an array or object');
      suggestions.push('Use [] to iterate: .items[]');
    }

    return suggestions;
  }
}

// Singleton instance
export const jqService = new JQService();
