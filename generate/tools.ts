import {DescField,DescMessage} from "@bufbuild/protobuf";

// field: MessageId id = 1 => messageId: datatypes.MessageId
// field: uint64 id = 1 => id: BigInt
export function getFieldAsAParameter(field: DescField): string {
    const isOptional = field.proto.proto3Optional || field.fieldKind === "list";
    return `${field.localName}: ${ isOptional ? 'Type.Optional(' : ""}${getFieldType(field)}${isOptional ? ")" : ""}`;
}

export function getFieldType(field: DescField): string {
    let prefix = field.message ? getModulePrefixFromFileName(field.message.file.name)
        : field.enum ? getModulePrefixFromFileName(field.enum.file.name) : "";

    let type: string;
    if (field.scalar) {
        type = prefix + ScalarProto_Type[field.scalar];
    } else {
        // type = `Type.Object(${getFieldType(field)})`
        throw new Error("Unsupported nested objects");
    }
    if (field.fieldKind === "list") {
        return `Type.Array(${type})`;
    }

    return type;
}

function getModulePrefixFromFileName(fileName: string) {
    return fileName.split("/").slice(-3, -2)[0] + ".";
}

export const ScalarProto_Type = {
    1: "Type.Number()",      // DOUBLE
    2: "Type.Number()",      // FLOAT
    3: "Type.BigInt()",      // INT64
    4: "Type.BigInt()",      // UINT64
    5: "Type.Number()",      // INT32
    6: "Type.BigInt()",      // FIXED64
    7: "Type.Number()",      // FIXED32
    8: "Type.boolean()",     // BOOL
    9: "Type.String()",      // STRING
    12: "Type.Uint8Array()", // BYTES
    13: "Type.Number()",     // UINT32
    15: "Type.Number()",     // SFIXED32
    16: "Type.BigInt()",     // SFIXED64
    17: "Type.Number()",     // SINT32 (uses ZigZag encoding, still fits in `number`)
    18: "Type.BigInt()",     // SINT64 (uses ZigZag encoding, needs `bigint`)
} as const;
