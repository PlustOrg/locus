import { parseLocus, LocusParserError } from '../../src/parser';

describe('Parser: design_system blocks', () => {
  test('design_system with colors, typography, spacing', () => {
    const src = `
      design_system {
        colors { light { primary: "#007bff" } dark { primary: "#0a84ff" } }
        typography { fontFamily: "Inter" baseSize: "16px" weights { regular: 400 bold: 700 } }
        spacing { sm: "0.5rem" md: "1rem" }
      }
    `;
    expect(() => parseLocus(src)).toThrow(LocusParserError);
  });

  test('nested themes', () => {
    const src = `
      design_system {
        colors { light { primary: "#fff" } dark { primary: "#000" } }
      }
    `;
    expect(() => parseLocus(src)).toThrow(LocusParserError);
  });

  test('multiple design_system blocks', () => {
    const src = `
      design_system { spacing { lg: "1.5rem" } }
      design_system { radii { md: "0.375rem" } }
    `;
    expect(() => parseLocus(src)).toThrow(LocusParserError);
  });
});
