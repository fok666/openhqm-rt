import React from 'react';
import { Box } from '@mui/material';

interface CodeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  'data-testid'?: string;
  placeholder?: string;
  rows?: number;
}

export const CodeTextarea: React.FC<CodeTextareaProps> = ({
  value,
  onChange,
  readOnly = false,
  'data-testid': testId,
  placeholder,
  rows,
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <textarea
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          height: '100%',
          fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          padding: '8px 12px',
          border: 'none',
          outline: 'none',
          resize: 'none',
          backgroundColor: readOnly ? '#f5f5f5' : '#fff',
          color: '#333',
          tabSize: 2,
          boxSizing: 'border-box',
          overflow: 'auto',
        }}
        spellCheck={false}
      />
    </Box>
  );
};
