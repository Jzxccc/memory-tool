// memory mcp — start MCP stdio server

export async function mcpCommand() {
  // Dynamic import to prevent native deps from touching stdout before sentinel
  const { startMCPServer } = await import('../mcp/server.js');
  const projectRoot = process.cwd();
  await startMCPServer(projectRoot);
}
