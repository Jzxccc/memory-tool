// memory mcp — start MCP stdio server

export async function mcpCommand(projectPath?: string) {
  // Dynamic import to prevent native deps from touching stdout before sentinel
  const { startMCPServer } = await import('../mcp/server.js');
  const projectRoot = projectPath || process.cwd();
  await startMCPServer(projectRoot);
}
