"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("../../src/parser");
describe('Parser: design_system blocks', () => {
    test('design_system with colors, typography, spacing', () => {
        const src = `
      design_system {
        colors { light { primary: "#007bff" } dark { primary: "#0a84ff" } }
        typography { fontFamily: "Inter" baseSize: "16px" weights { regular: 400 bold: 700 } }
        spacing { sm: "0.5rem" md: "1rem" }
      }
    `;
        const ast = (0, parser_1.parseLocus)(src);
        expect(ast.designSystems).toHaveLength(1);
        const ds = ast.designSystems[0];
        expect(ds.colors?.light?.primary).toBe('#007bff');
        expect(ds.colors?.dark?.primary).toBe('#0a84ff');
        expect(ds.typography?.fontFamily).toBe('Inter');
        expect(ds.typography?.baseSize).toBe('16px');
        expect(ds.typography?.weights?.regular).toBe(400);
        expect(ds.typography?.weights?.bold).toBe(700);
        expect(ds.spacing?.sm).toBe('0.5rem');
        expect(ds.spacing?.md).toBe('1rem');
    });
    test('nested themes', () => {
        const src = `
      design_system {
        colors { light { primary: "#fff" } dark { primary: "#000" } }
      }
    `;
        const ast = (0, parser_1.parseLocus)(src);
        const ds = ast.designSystems[0];
        expect(ds.colors?.light?.primary).toBe('#fff');
        expect(ds.colors?.dark?.primary).toBe('#000');
    });
    test('multiple design_system blocks', () => {
        const src = `
      design_system { spacing { lg: "1.5rem" } }
      design_system { radii { md: "0.375rem" } }
    `;
        const ast = (0, parser_1.parseLocus)(src);
        expect(ast.designSystems).toHaveLength(2);
        expect(ast.designSystems[0].spacing?.lg).toBe('1.5rem');
        expect(ast.designSystems[1].radii?.md).toBe('0.375rem');
    });
});
