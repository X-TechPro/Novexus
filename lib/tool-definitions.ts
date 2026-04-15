export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'calculate',
      description: 'Evaluate a mathematical expression. Supports basic math and functions.',
      parameters: {
        type: 'object',
        properties: {
          expr: { type: 'string', description: 'Mathematical expression to evaluate' }
        },
        required: ['expr']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'memories',
      description: "Read or write memories. Use 'read' to get all memories, or 'write' to add a new memory.",
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['read', 'write'],
            description: "'read' to get all, 'write' to add"
          },
          memory: {
            type: 'string',
            description: "Memory to add (required if action is 'write')"
          }
        },
        required: ['action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'files',
      description: 'Read, write, or list files in the current workspace.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['read', 'write', 'append', 'list'],
            description: 'The file operation'
          },
          filename: {
            type: 'string',
            description: 'Name of the file'
          },
          content: {
            type: 'string',
            description: 'Content for write/append'
          }
        },
        required: ['action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'clock',
      description: 'Get the current date and time.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Execute a shell command. Use with caution.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The command to run'
          }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search',
      description: 'Search the web for information.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'open_page',
      description: 'Open a specific website URL to read its content in a clean, readable format.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL of the website to open' }
        },
        required: ['url']
      }
    }
  }
]
