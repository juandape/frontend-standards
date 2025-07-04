# 📋 Frontend Standards Checker - Lista Completa de Reglas

> **🆕 Compatibilidad**: Frontend Standards Checker soporta tanto proyectos React/Next.js como aplicaciones **React Native**. Incluye reglas específicas para organización multiplataforma (.web.tsx/.native.tsx), separación de código específico por plataforma y buenas prácticas para ambos entornos.

## 🔴 Reglas de Error (22 total)

_Las reglas de error indican problemas críticos que pueden romper el código o impedir la compilación._

### 🏷️ Naming (10 reglas)

1. **Component naming** `(naming)` - Archivos de componentes deben usar PascalCase
2. **Hook naming** `(naming)` - Hooks deben seguir patrón "useHookName.hook.ts" con PascalCase despues del "use"
3. **Type naming** `(naming)` - Archivos de tipos deben ser camelCase + .type.ts/.types.ts
4. **Helper naming** `(naming)` - Helpers deben ser camelCase + .helper.ts/.helper.tsx
5. **Style naming** `(naming)` - Estilos deben ser camelCase + .style.ts
6. **Assets naming** `(naming)` - Assets deben usar kebab-case
7. **Folder naming convention** `(naming)` - Usar nombres plurales: helpers, hooks, types, etc.
8. **Interface naming with I prefix** `(naming)` - Interfaces deben usar prefijo "I" + PascalCase
9. **Test file naming convention** `(naming)` - Tests deben seguir _.test.tsx o _.spec.tsx
10. **Component function name match** `(naming)` - La función principal en index.tsx debe tener el mismo nombre que su carpeta contenedora

### 💻 Content/TypeScript (12 reglas)

11. **No var** `(content)` - Usar let o const en lugar de var
12. **No any type** `(typescript)` - Evitar tipo "any", usar tipos específicos
13. **No alert** `(content)` - No usar alert(), usar notificaciones apropiadas
14. **No hardcoded URLs** `(content)` - No URLs hardcodeadas, usar variables de entorno
15. **No jQuery** `(content)` - No usar jQuery en proyectos modernos
16. **No circular dependencies** `(content)` - Evitar dependencias circulares
17. **No merge conflicts markers** `(content)` - Resolver marcadores de conflictos de Git
18. **No committed credentials** `(content)` - No commitear credenciales o datos sensibles
19. **Client component directive** `(react)` - Componentes con features client-side deben incluir "use client"
20. **Proper key prop in lists** `(react)` - Elementos en arrays deben tener prop key
21. **Button missing accessible name** `(accessibility)` - Botones deben tener nombres accesibles
22. **Form inputs missing labels** `(accessibility)` - Inputs deben tener labels asociados

---

## 🟡 Reglas de Warning (21 total)

_Las reglas de warning señalan mejores prácticas importantes que deberían seguirse._

### 🏗️ Structure (4 reglas)

1. **Folder structure** `(structure)` - Componentes deben seguir estructura apropiada en src/
2. **Src structure** `(structure)` - Archivos deben organizarse en estructura src/ apropiada
3. **Component size limit** `(structure)` - Componentes no deben exceder 200 líneas
4. **No circular dependencies** `(structure)` - Detectar dependencias circulares potenciales

### 📝 Content/Documentation (6 reglas)

5. **No console.log** `(content)` - Remover console statements antes de producción
6. **No inline styles** `(content)` - Evitar estilos inline, usar CSS classes
7. **Next.js Image optimization** `(performance)` - Usar componente Image de Next.js
8. **Image alt text** `(accessibility)` - Imágenes deben tener texto alt
9. **Must use async/await** `(content)` - Preferir async/await sobre .then()
10. **Missing comment in complex function** `(documentation)` - Funciones complejas deben tener comentarios

### 🔷 TypeScript (3 reglas)

11. **Prefer type over interface for unions** `(typescript)` - Usar "type" para verdaderas uniones
12. **Interface naming convention** `(typescript)` - Interfaces deben seguir convenciones de naming
13. **Missing index.ts in organization folders** `(structure)` - Carpetas de organización deben tener index.ts

### ⚛️ React/Performance (5 reglas)

14. **Proper hook dependencies** `(react)` - useEffect/useCallback deben incluir todas las dependencias
15. **Component props interface** `(react)` - Componentes React deben definir props con interfaces TypeScript
16. **Avoid React.FC** `(react)` - Evitar React.FC, usar declaración de función regular
17. **Styled components naming** `(react)` - Styled components deben usar PascalCase
18. **Avoid inline functions in JSX** `(performance)` - Evitar funciones inline en props JSX

### 📦 Imports (3 reglas)

19. **Import order** `(structure)` - Imports deben ordenarse: externos, internos, relativos
20. **Use absolute imports** `(imports)` - Usar imports absolutos en lugar de relativos profundos
21. **No unused imports** `(imports)` - Remover imports sin uso

---

## 🔵 Reglas de Info (16 total)

_Las reglas de info proporcionan sugerencias y optimizaciones opcionales._

### 🏗️ Structure/Organization (5 reglas)

1. **Missing test files** `(structure)` - Componentes importantes deben tener tests
2. **Constants naming** `(naming)` - Constantes deben ser camelCase + .constant.ts
3. **Directory naming convention** `(naming)` - Directorios deben seguir camelCase o PascalCase
4. **GitFlow branch naming convention** `(structure)` - Ramas deben seguir convención GitFlow
5. **Next.js app router naming** `(naming)` - Directorios de Next.js app router deben usar kebab-case

### 📖 Documentation (2 reglas)

6. **Should have TSDoc comments** `(documentation)` - Funciones exportadas deben tener comentarios TSDoc
7. **JSDoc for complex functions** `(documentation)` - Funciones muy complejas deben tener JSDoc

### 🔷 TypeScript (3 reglas)

8. **Explicit return types for functions** `(typescript)` - Funciones públicas deben tener tipos de retorno explícitos
9. **Proper generic naming** `(typescript)` - Parámetros de tipos genéricos deben tener nombres descriptivos
10. **No default and named imports mixed** `(imports)` - Preferir statements de import separados

### ⚡ Performance (2 reglas)

11. **Missing React.memo for pure components** `(performance)` - Considerar React.memo para componentes puros
12. **Large bundle imports** `(performance)` - Considerar imports específicos para librerías grandes

### 📱 React Native (1 regla)

13. **Platform-specific code organization** `(structure)` - Usar extensiones .web.tsx y .native.tsx para código específico de plataforma

### ♿ Accessibility/Styles (3 reglas)

14. **Links missing accessible names** `(accessibility)` - Links deben tener texto descriptivo
15. **Missing focus management** `(accessibility)` - Componentes con modales deben manejar focus
16. **Color contrast considerations** `(accessibility)` - Considerar ratios de contraste de color

---

## 📊 Resumen Estadístico

| Tipo            | Cantidad      | Descripción                   |
| --------------- | ------------- | ----------------------------- |
| 🔴 **Errores**  | **22 reglas** | Código se rompe o no compila  |
| 🟡 **Warnings** | **21 reglas** | Mejores prácticas importantes |
| 🔵 **Info**     | **16 reglas** | Sugerencias y optimizaciones  |
| 📈 **Total**    | **59 reglas** |                               |

### 🏆 Categorías Más Importantes

| Categoría | Reglas | Descripción |
| 📱 **React Native** | **1 regla** | Soporte específico para React Native |
| -------------------- | ------------- | -------------------------------------- |
| 🏷️ **Naming** | **14 reglas** | Convenciones de nomenclatura |
| ⚛️ **React** | **8 reglas** | Mejores prácticas específicas de React |
| 🔷 **TypeScript** | **8 reglas** | Tipado y convenciones TS |
| 💻 **Content** | **7 reglas** | Calidad y seguridad del código |
| ♿ **Accessibility** | **6 reglas** | Accesibilidad web |
| ⚡ **Performance** | **5 reglas** | Optimización de rendimiento |
| 🏗️ **Structure** | **5 reglas** | Organización de archivos |
| 📖 **Documentation** | **4 reglas** | Documentación del código |
| 📦 **Imports** | **4 reglas** | Gestión de importaciones |

---

> **💡 Nota:** Este documento se actualiza automáticamente conforme se agregan o modifican reglas en el Frontend Standards Checker.
>
> **🆕 v4.5.0:** Se corrigió un bug crítico donde las reglas INFO no aparecían en los reportes. Ahora todas las reglas de severidad INFO se muestran correctamente en la sección "DETAILED INFO SUGGESTIONS" del log.
