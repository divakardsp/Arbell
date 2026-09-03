                 ONE OpenAI iteration
                         │
        ┌────────────────┴────────────────┐
        │                                 │
   Tool-call response              Final-text response
        │                                 │
        ▼                                 ▼
 output_item.added                 text.delta
 arguments.delta                   text.delta
 arguments.delta                   text.delta
 output_item.done                       │
        │                               │
        └──────────────┐                │
                       ▼                │
              response.completed ◄──────┘
                       │
                       ▼
              "This iteration is done"
                       │
            ┌──────────┴──────────┐
            │                     │
       tool calls?            no tool calls
            │                     │
            ▼                     ▼
       execute tools          final answer
            │
            ▼
       OpenAI again




       -----------------------------------------------------


                         YOUR APPLICATION
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Agent                                                   │
│    │                                                     │
│    ▼                                                     │
│  LLM                                                    │
│    │                                                     │
│    │ "call getProduct"                                  │
│    ▼                                                     │
│  MCP Client                                              │
│    │                                                     │
│    │ client.callTool()                                  │
│    ▼                                                     │
│  ┌──────────────────────────┐                           │
│  │ CLIENT TRANSPORT         │                           │
│  │ StreamableHTTP...        │                           │
│  └────────────┬─────────────┘                           │
│               │                                          │
└───────────────┼──────────────────────────────────────────┘
                │
                │        HTTPS / HTTP
                │
════════════════╪══════════ NETWORK ═══════════════════════
                │
                ▼
┌───────────────┼──────────────────────────────────────────┐
│               │       Vercel                             │
│               ▼                                          │
│        /api/mcp route                                    │
│               │                                          │
│        authenticate                                      │
│               │                                          │
│               ▼                                          │
│  ┌──────────────────────────┐                           │
│  │ SERVER TRANSPORT         │                           │
│  │ WebStandardStreamable... │                           │
│  └────────────┬─────────────┘                           │
│               │                                          │
│               │ server.connect(transport)               │
│               │                                          │
│               ▼                                          │
│        ┌──────────────┐                                  │
│        │  MCP SERVER  │                                  │
│        └──────┬───────┘                                  │
│               │                                          │
│               ▼                                          │
│        getProductTool                                    │
│               │                                          │
│               ▼                                          │
│        Your Service                                      │
│               │                                          │
│               ▼                                          │
│             DB                                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
       