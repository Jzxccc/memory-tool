// memory rebuild — regenerate index.json and graph.json from .md files
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getMemoryDir, listNodeFiles, parseNodeId } from '../storage/repo-manager.js';
import { createIndexEntry, writeIndex, createEmptyIndex, } from '../storage/index-handler.js';
import { MemoryGraph } from '../core/graph/graph.js';
import { writeGraph } from '../core/graph/graph-io.js';
function extractFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match)
        return null;
    return { frontmatter: match[1], body: match[2] };
}
function parseYamlLike(text) {
    const result = {};
    const lines = text.split('\n');
    for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx <= 0)
            continue;
        const key = line.substring(0, colonIdx).trim();
        let value = line.substring(colonIdx + 1).trim();
        if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, '')).filter(s => s.length > 0);
        }
        result[key] = value;
    }
    return result;
}
export async function rebuildCommand(options) {
    const projectRoot = process.cwd();
    const memoryDir = getMemoryDir(projectRoot);
    const indexPath = path.join(memoryDir, 'index.json');
    const graphPath = path.join(memoryDir, 'graph.json');
    console.log('Rebuilding index...');
    // Phase 1: Scan
    const files = listNodeFiles(memoryDir);
    console.log(`  Scan: ${files.length} files found`);
    // Phase 2: Parse
    const index = createEmptyIndex();
    const graph = new MemoryGraph();
    let parsed = 0;
    for (const relPath of files) {
        const fullPath = path.join(memoryDir, relPath);
        try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const parsedContent = extractFrontmatter(content);
            if (!parsedContent)
                continue;
            const fm = parseYamlLike(parsedContent.frontmatter);
            const id = fm.id || parseNodeId(relPath) || path.basename(relPath, '.md');
            const type = fm.type || 'unknown';
            const tags = Array.isArray(fm.tags) ? fm.tags : [];
            const relates = Array.isArray(fm.relates) ? fm.relates : [];
            const depends = Array.isArray(fm.depends_on) ? fm.depends_on : [];
            // Add to index
            index.entries[id] = createIndexEntry(id, type, content, parsedContent.frontmatter, tags, relPath);
            // Add node to graph
            graph.addNode({ id, type, data: fm });
            // Phase 4: Link — add relationship edges
            // contains (for flow steps and relates)
            for (const relatedId of relates) {
                graph.addEdge({
                    from: id,
                    to: relatedId,
                    type: 'references',
                    confidence: 1.0,
                });
            }
            // depends_on
            for (const depId of depends) {
                graph.addEdge({
                    from: id,
                    to: depId,
                    type: 'depends_on',
                    confidence: 1.0,
                });
            }
            // Flow steps → flows_through
            if (type === 'flow' && fm.steps) {
                const steps = fm.steps;
                for (const step of steps) {
                    graph.addEdge({
                        from: id,
                        to: step.component,
                        type: 'flows_through',
                        step: step.order,
                        confidence: 1.0,
                    });
                }
            }
            parsed++;
        }
        catch (err) {
            console.error(`  Error parsing ${relPath}: ${err}`);
        }
    }
    index.entryCount = parsed;
    // Phase 5: Write
    console.log(`  Parse: ${parsed} entries parsed`);
    writeIndex(indexPath, index);
    console.log(`  Index: written to index.json`);
    writeGraph(graphPath, graph);
    console.log(`  Graph: ${graph.getEdgeCount()} relationships written to graph.json`);
    // Engine mode
    if (options.engine === 'libsql') {
        console.log(`  Engine: libsql mode not yet implemented`);
    }
    console.log(`\nDone! ${parsed} entries indexed.`);
}
//# sourceMappingURL=rebuild.js.map