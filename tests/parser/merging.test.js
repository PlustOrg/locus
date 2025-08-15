"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("../../src/parser");
const merger_1 = require("../../src/parser/merger");
describe('AST Merging', () => {
    test('merges entities from multiple files', () => {
        const a = (0, parser_1.parseLocus)(`database { entity A { x: String } }`);
        const b = (0, parser_1.parseLocus)(`database { entity B { y: Integer } }`);
        const merged = (0, merger_1.mergeAsts)([a, b]);
        const names = merged.database.entities.map(e => e.name).sort();
        expect(names).toEqual(['A', 'B']);
    });
    test('merges design_system tokens from multiple files', () => {
        const a = (0, parser_1.parseLocus)(`design_system { spacing { sm: "0.5rem" } }`);
        const b = (0, parser_1.parseLocus)(`design_system { spacing { md: "1rem" } radii { md: "0.375rem" } }`);
        const merged = (0, merger_1.mergeAsts)([a, b]);
        expect(merged.designSystem?.spacing?.sm).toBe('0.5rem');
        expect(merged.designSystem?.spacing?.md).toBe('1rem');
        expect(merged.designSystem?.radii?.md).toBe('0.375rem');
    });
    test('duplicate entity names throw', () => {
        const a = (0, parser_1.parseLocus)(`database { entity A { x: String } }`);
        const b = (0, parser_1.parseLocus)(`database { entity A { y: Integer } }`);
        expect(() => (0, merger_1.mergeAsts)([a, b])).toThrow(merger_1.MergeError);
    });
});
