import { createEcmaScriptPlugin, runNodeJs, Schema } from "@bufbuild/protoplugin";
import { DescMethod, DescService } from "@bufbuild/protobuf";
import {getFieldAsAParameter} from "./tools";

function dumpCommandService(service: DescService, method: DescMethod): string {
    // is list method (specific case)
    let isListMethod: boolean = method.methodKind === "server_streaming" && method.output.fields.length === 1 && method.output.fields[0].fieldKind === "list";
    // method name
    const clientMethodName = service.name.endsWith("AdminService") ? `admin${method.name}` : method.name[0].toLowerCase() + method.name.slice(1);

    const name = method.name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    let label = method.name.replace(/[A-Z]/g, letter => `${letter.toUpperCase()}`); // TODO upper first char
    label = label.charAt(0).toUpperCase() + label.slice(1);
    let description = `rpc service: ${service.name}, method: ${method.name}`;

    let parameters;
    try {
        parameters = `accountId: Type.String(), ${method.input.fields.filter(f => !f.proto.proto3Optional).map(f => getFieldAsAParameter(f)).join(", ")}`;
    } catch {
        console.error(`Ignored unsupported method: ${method.name}`)
        return "";
    }

    let executeBody: string = `
        const client = getOlvidClient((params as {accountId: string}).accountId);
    `;


    // client side streaming methods
    if (method.methodKind === "client_streaming" || method.methodKind === "bidi_streaming") {
    }
    // other server streaming methods
    else if (method.methodKind === "server_streaming") {
    }
    // unary methods
    else if (method.methodKind === "unary") {
        method.input.fields.forEach(f => executeBody += `\t// @ts-ignore\n\t\tconst ${f.localName} = params.${f.localName};\n`)
        executeBody += `\t\tconst ret = await client.${clientMethodName}(${method.input.fields.map(f => f.localName).join(", ")})\n`
        executeBody += `\t\tconst result: { content: any, details: string; } = {
            content: [{type: "text", text: JSON.stringify(ret)}],
            details: "Result of ${method.name} method."
        };
`
    }

    executeBody += `
        client.stop();
        return result;
    `

    // Type.Object({})
    return `\t{
        name: "${clientMethodName}",
        label: "${label}",
        description: "${description}",
        parameters: Type.Object({${parameters}}),
        async execute(_id: string, params: unknown) {
            ${executeBody}
        }
    }`
}

export function generateAgentTools(schema: Schema) {
    // generate fron service files only
    if (schema.files.filter(f => f.name.includes("/services/")).length === 0) {
        return;
    }

    let agentFile = schema.generateFile("agent_tools.ts");

    agentFile.print`import {getOlvidRuntime} from "../runtime";
import {ResolvedOlvidAccount, resolveOlvidAccount} from "../accounts";
import {CoreConfig} from "../types";
import {OlvidClient,datatypes, command} from "@olvid/bot-node";
import { Type } from "@sinclair/typebox";

function getOlvidClient(accountId: string): OlvidClient {
    const runtime = getOlvidRuntime();
    const config = runtime.config.loadConfig();

    // Retrieve the configuration/credentials for the specific accountId, or fallback to default
    let olvidAccount: ResolvedOlvidAccount = resolveOlvidAccount({cfg: config as CoreConfig, accountId});
    if (!olvidAccount || !olvidAccount.daemonUrl || !olvidAccount.clientKey) {
        olvidAccount = resolveOlvidAccount({cfg: config as CoreConfig, accountId: "default"});
    }
    return new OlvidClient({clientKey: olvidAccount.clientKey, serverUrl: olvidAccount.daemonUrl});
}

export const olvidAgentTools = [
`

    let commandServiceFile = schema.files.filter(f => f.name.includes("/services/v1/command")).pop();

    /*
    ** command and notification methods
     */
    let tools  = ""
    commandServiceFile?.services.forEach(service => {
        tools += `    /*\n    ** ${service.name}\n    */\n`
        service.methods.forEach(method => {
            tools += dumpCommandService(service, method) + ",\n";
        })
    })

    agentFile.print(tools)
    agentFile.print("]\n");
}

const plugin = createEcmaScriptPlugin({
    name: "protoc-gen-agent-tools",
    version: process.env.npm_package_version ?? "1.0.0",
    generateTs: function (schema: Schema): void {
        generateAgentTools(schema);
    }
});

runNodeJs(plugin);
