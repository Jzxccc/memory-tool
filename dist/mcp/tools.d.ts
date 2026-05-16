export declare const MEMORY_TOOLS: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            query: {
                type: string;
                description: string;
            };
            category: {
                type: string;
                enum: string[];
                description: string;
            };
            tag: {
                type: string;
                description: string;
            };
            top: {
                type: string;
                default: number;
                description: string;
            };
            id?: undefined;
            related?: undefined;
            depth?: undefined;
            direction?: undefined;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        openWorldHint: boolean;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            id: {
                type: string;
                description: string;
            };
            related: {
                type: string;
                description: string;
            };
            query?: undefined;
            category?: undefined;
            tag?: undefined;
            top?: undefined;
            depth?: undefined;
            direction?: undefined;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        openWorldHint?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            id: {
                type: string;
                description: string;
            };
            depth: {
                type: string;
                default: number;
                description: string;
            };
            direction: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            query?: undefined;
            category?: undefined;
            tag?: undefined;
            top?: undefined;
            related?: undefined;
        };
        required: string[];
    };
    annotations: {
        readOnlyHint: boolean;
        openWorldHint?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties?: undefined;
        required?: undefined;
    };
    annotations: {
        readOnlyHint: boolean;
        openWorldHint?: undefined;
    };
})[];
//# sourceMappingURL=tools.d.ts.map