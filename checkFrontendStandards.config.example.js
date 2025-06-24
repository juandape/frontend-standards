/**
 * Configuración personalizada para Frontend Standards Checker
 *
 * Este archivo muestra cómo extender o modificar las reglas predeterminadas
 */

export default function (defaultRules) {
  return {
    // Combinar reglas predeterminadas con personalizadas
    rules: [
      ...defaultRules,

      // Regla personalizada: No uso de eval
      {
        name: 'No eval',
        check: (content) => content.includes('eval('),
        message: 'El uso de eval() está prohibido por razones de seguridad.',
      },

      // Regla personalizada: Validar imports de librerías externas
      {
        name: 'Import validation',
        check: (content) => {
          const prohibitedImports = ['lodash', 'moment', 'jquery'];
          return prohibitedImports.some(
            (lib) =>
              content.includes(`from '${lib}'`) ||
              content.includes(`require('${lib}')`)
          );
        },
        message:
          'Uso de librerías prohibidas detectado. Usar alternativas modernas.',
      },
    ],

    // Configuración de zonas para monorepos
    zones: {
      includePackages: true,
      customZones: ['libs', 'tools', 'docs'],
    },

    // Extensiones de archivo adicionales
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.vue'],

    // Patrones adicionales a ignorar
    ignorePatterns: [
      'storybook-static',
      '*.stories.js',
      '*.stories.ts',
      'cypress',
      'e2e',
    ],

    // Estructura esperada personalizada
    structure: {
      app: ['pages', 'components', 'public', 'styles'],
      package: ['src', 'package.json', 'README.md'],
    },
  };
}
