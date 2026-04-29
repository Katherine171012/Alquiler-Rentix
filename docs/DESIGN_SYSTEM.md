# 🎨 RentixAutos - Design System Profesional

> **✅ ESTADO: IMPLEMENTADO** - El sistema de diseño ha sido implementado en los archivos CSS del proyecto.
> - `src/styles/theme.css` - Tokens de diseño (colores, espaciado, tamaños)
> - `src/styles/components.css` - Estilos de componentes reutilizables
> - `src/styles/utilities.css` - Utilidades y helpers
>
> **Uso:** Los componentes ahora pueden usar clases como `.btn-primary`, `.card`, `.badge-success`, etc.

---

## 📊 AUDITORÍA DEL ESTADO ACTUAL (Pre-implementación)

### ❌ Problemas Detectados:
1. **Colores inconsistentes** - Borgoña oscuro (#5A1429) puede tener poco contraste
2. **Sin sistema de estados** - Faltan success, warning, info definidos
3. **Sombras inexistentes** - No hay elevación definida
4. **Espaciados arbitrarios** - No hay escala consistente
5. **Tipografía sin definir** - Pesos y tamaños mezclados
6. **Border radius variable** - 0.5rem base pero inconsistente
7. **Iconos lucide** - ✅ Bien, pero tamaños inconsistentes

---

## 1. 🎨 PALETA DE COLORES PROFESIONAL

### Colores Principales

```css
/* PRIMARY - Borgoña Sofisticado */
--primary-50: #fdf2f5;
--primary-100: #fce7ed;
--primary-200: #fad0dd;
--primary-300: #f6a9c1;
--primary-400: #f0769b;
--primary-500: #e54876;
--primary-600: #cf2d5d;   /* Principal para botones */
--primary-700: #b11f48;
--primary-800: #941d3e;
--primary-900: #7d1d38;   /* Sidebar oscuro */
--primary-950: #470b1c;   /* Muy oscuro */
```

**¿Por qué?** Escala completa permite estados hover, active, disabled sin adivinar. El 600 tiene mejor contraste que el actual #5A1429.

### Colores Neutros (Grises)

```css
--gray-50: #f9fafb;    /* Fondos sutiles */
--gray-100: #f3f4f6;   /* Fondos cards */
--gray-200: #e5e7eb;   /* Bordes */
--gray-300: #d1d5db;   /* Bordes hover */
--gray-400: #9ca3af;   /* Iconos disabled */
--gray-500: #6b7280;   /* Texto secundario */
--gray-600: #4b5563;   /* Texto normal */
--gray-700: #374151;   /* Texto importante */
--gray-800: #1f2937;   /* Títulos */
--gray-900: #111827;   /* Negro casi puro */
```

### Estados Semánticos

```css
/* SUCCESS */
--success-50: #f0fdf4;
--success-100: #dcfce7;
--success-500: #22c55e;   /* Principal */
--success-600: #16a34a;   /* Hover */
--success-700: #15803d;   /* Active */

/* WARNING */
--warning-50: #fffbeb;
--warning-100: #fef3c7;
--warning-500: #f59e0b;   /* Principal */
--warning-600: #d97706;   /* Hover */
--warning-700: #b45309;   /* Active */

/* ERROR */
--error-50: #fef2f2;
--error-100: #fee2e2;
--error-500: #ef4444;     /* Principal */
--error-600: #dc2626;     /* Hover */
--error-700: #b91c1c;     /* Active */

/* INFO */
--info-50: #eff6ff;
--info-100: #dbeafe;
--info-500: #3b82f6;      /* Principal */
--info-600: #2563eb;      /* Hover */
--info-700: #1d4ed8;      /* Active */
```

**¿Por qué?** Consistencia en feedback visual. El usuario sabe qué significa cada color instantáneamente.

### Fondos y Superficies

```css
--bg-base: #ffffff;           /* Fondo principal */
--bg-subtle: #f9fafb;         /* Fondo alternativo */
--bg-muted: #f3f4f6;          /* Zonas menos importantes */
--surface-raised: #ffffff;    /* Cards elevadas */
--surface-overlay: #ffffff;   /* Modales */
```

---

## 2. 📐 BORDER RADIUS (Consistencia)

```css
--radius-none: 0;
--radius-sm: 0.375rem;    /* 6px - Pills, badges */
--radius-md: 0.5rem;      /* 8px - Inputs, botones pequeños */
--radius-lg: 0.75rem;     /* 12px - Botones, cards */
--radius-xl: 1rem;        /* 16px - Cards grandes, modales */
--radius-2xl: 1.5rem;     /* 24px - Hero sections */
--radius-full: 9999px;    /* Circular */
```

### Aplicación por Componente:

| Componente | Radius | Por qué |
|------------|--------|---------|
| Botones primarios | `lg (12px)` | Modernos sin ser infantiles |
| Inputs | `md (8px)` | Sutiles y funcionales |
| Cards | `xl (16px)` | Destacan sin exagerar |
| Modales | `xl (16px)` | Consistente con cards |
| Badges | `full` | Reconocibles al instante |
| Tablas | `lg (12px)` | Profesional |
| Sidebar | `none` | Máximo espacio |

---

## 3. 💎 SOMBRAS Y ELEVACIONES

```css
/* Subtle - Para elementos planos con mínima elevación */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Default - Cards, dropdowns */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.08),
             0 2px 4px -2px rgb(0 0 0 / 0.05);

/* Elevated - Modales, popovers */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08),
             0 4px 6px -4px rgb(0 0 0 / 0.05);

/* Floating - Elementos flotantes (toasts) */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08),
             0 8px 10px -6px rgb(0 0 0 / 0.05);

/* Overlay - Modales grandes */
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.15);
```

**¿Por qué sombras suaves?** Los sistemas modernos SaaS (Linear, Vercel, Stripe) usan sombras sutiles. Sombras fuertes se ven anticuadas.

### Aplicación por Componente:

| Componente | Shadow | Hover |
|------------|--------|-------|
| Cards | `md` | `lg` |
| Dropdowns | `lg` | - |
| Modales | `2xl` | - |
| Botones | `sm` | `md` |
| Navbar | `sm` | - |
| Sidebar | `none` | - |

---

## 4. 🔤 TIPOGRAFÍA PROFESIONAL

### Escala de Tamaños

```css
--text-xs: 0.75rem;      /* 12px - Labels pequeños, badges */
--text-sm: 0.875rem;     /* 14px - Texto secundario, tablas */
--text-base: 1rem;       /* 16px - Texto normal, inputs */
--text-lg: 1.125rem;     /* 18px - Subtítulos */
--text-xl: 1.25rem;      /* 20px - Títulos cards */
--text-2xl: 1.5rem;      /* 24px - Títulos secciones */
--text-3xl: 1.875rem;    /* 30px - Títulos páginas */
--text-4xl: 2.25rem;     /* 36px - Hero */
```

### Pesos (Font Weights)

```css
--font-normal: 400;      /* Texto normal */
--font-medium: 500;      /* Labels, botones */
--font-semibold: 600;    /* Títulos, destacados */
--font-bold: 700;        /* Números grandes, CTA */
```

### Line Heights

```css
--leading-tight: 1.25;   /* Títulos */
--leading-normal: 1.5;   /* Texto normal */
--leading-relaxed: 1.75; /* Párrafos largos */
```

### Aplicación por Componente:

| Elemento | Tamaño | Peso | Line Height |
|----------|--------|------|-------------|
| Navbar brand | `xl` | `semibold` | `tight` |
| Sidebar items | `sm` | `medium` | `normal` |
| Page titles | `3xl` | `semibold` | `tight` |
| Card titles | `xl` | `medium` | `tight` |
| Body text | `base` | `normal` | `normal` |
| Table headers | `xs` | `medium` | `tight` |
| Table cells | `sm` | `normal` | `normal` |
| Button text | `base` | `medium` | `tight` |
| Input text | `base` | `normal` | `normal` |
| Labels | `sm` | `medium` | `normal` |
| Breadcrumbs | `sm` | `normal` | `normal` |

---

## 5. 📏 DIMENSIONES Y ESPACIADOS EXACTOS

### Escala de Espaciado

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### Componentes - Dimensiones Exactas

#### Navbar
```css
--navbar-height: 64px;         /* 4rem */
--navbar-padding-x: 24px;      /* space-6 */
--navbar-padding-y: 12px;      /* space-3 */
--navbar-logo-size: 40px;      /* 2.5rem */
--navbar-gap: 24px;            /* space-6 */
```

#### Sidebar
```css
--sidebar-width-expanded: 256px;    /* 16rem */
--sidebar-width-collapsed: 72px;     /* 4.5rem */
--sidebar-padding: 16px;             /* space-4 */
--sidebar-item-height: 44px;         /* 2.75rem */
--sidebar-item-padding-x: 16px;      /* space-4 */
--sidebar-item-gap: 12px;            /* space-3 */
--sidebar-section-gap: 24px;         /* space-6 */
```

#### Cards
```css
--card-padding: 24px;           /* space-6 */
--card-padding-sm: 16px;        /* space-4 */
--card-padding-lg: 32px;        /* space-8 */
--card-gap: 16px;               /* space-4 */
--card-header-gap: 8px;         /* space-2 */
```

#### Botones
```css
/* Botón Small */
--btn-sm-height: 32px;          /* 2rem */
--btn-sm-padding-x: 12px;       /* space-3 */
--btn-sm-padding-y: 6px;        /* space-1.5 */
--btn-sm-gap: 6px;              /* space-1.5 */

/* Botón Medium (default) */
--btn-md-height: 40px;          /* 2.5rem */
--btn-md-padding-x: 16px;       /* space-4 */
--btn-md-padding-y: 10px;       /* space-2.5 */
--btn-md-gap: 8px;              /* space-2 */

/* Botón Large */
--btn-lg-height: 48px;          /* 3rem */
--btn-lg-padding-x: 24px;       /* space-6 */
--btn-lg-padding-y: 12px;       /* space-3 */
--btn-lg-gap: 8px;              /* space-2 */
```

#### Inputs
```css
--input-height: 40px;           /* 2.5rem - Same as btn-md */
--input-padding-x: 12px;        /* space-3 */
--input-padding-y: 10px;        /* space-2.5 */
--input-icon-size: 20px;        /* 1.25rem */
--input-icon-gap: 8px;          /* space-2 */
```

#### Tablas
```css
--table-header-height: 44px;    /* 2.75rem */
--table-row-height: 64px;       /* 4rem - Cómodo sin ser excesivo */
--table-cell-padding-x: 24px;   /* space-6 */
--table-cell-padding-y: 16px;   /* space-4 */
```

#### Modales
```css
--modal-max-width-sm: 448px;    /* 28rem */
--modal-max-width-md: 672px;    /* 42rem */
--modal-max-width-lg: 896px;    /* 56rem */
--modal-padding: 24px;          /* space-6 */
--modal-header-height: 64px;    /* 4rem */
```

---

## 6. 🎯 ICONOS (Lucide React)

### Tamaños Consistentes

```css
--icon-xs: 14px;    /* 0.875rem - Badges */
--icon-sm: 16px;    /* 1rem - Inputs, table actions */
--icon-md: 20px;    /* 1.25rem - Botones, sidebar */
--icon-lg: 24px;    /* 1.5rem - Headers */
--icon-xl: 32px;    /* 2rem - Empty states */
--icon-2xl: 48px;   /* 3rem - Hero sections */
```

### Aplicación por Contexto:

| Contexto | Tamaño | Clase Lucide |
|----------|--------|--------------|
| Sidebar items | `md (20px)` | `w-5 h-5` |
| Botón con texto | `sm (16px)` | `w-4 h-4` |
| Botón icono solo | `md (20px)` | `w-5 h-5` |
| Input prefix | `sm (16px)` | `w-4 h-4` |
| Table actions | `sm (16px)` | `w-4 h-4` |
| Navbar | `lg (24px)` | `w-6 h-6` |
| Empty states | `2xl (48px)` | `w-12 h-12` |

**Separación icono-texto:** `8px` (space-2) es el estándar.

---

## 7. 🖥️ RESPONSIVE DESIGN

### Breakpoints Exactos

```css
--screen-sm: 640px;    /* Móvil grande / tablet pequeña */
--screen-md: 768px;    /* Tablet */
--screen-lg: 1024px;   /* Laptop */
--screen-xl: 1280px;   /* Desktop */
--screen-2xl: 1536px;  /* Desktop grande */
```

### Comportamientos por Dispositivo:

#### Mobile (< 768px)
- Sidebar: Oculto por defecto, overlay al abrir
- Navbar: Hamburger menu
- Cards: 1 columna
- Padding contenedor: `16px`
- Tablas: Scroll horizontal

#### Tablet (768px - 1024px)
- Sidebar: Colapsado (72px) o expandido (256px) toggle
- Cards: 2 columnas
- Padding contenedor: `24px`

#### Desktop (> 1024px)
- Sidebar: Siempre visible expandido
- Cards: 3-4 columnas (grid)
- Padding contenedor: `32px` máx
- Max-width contenedor: `1280px`

---

## 8. 🎨 COMPONENTES UI - Especificaciones

### Botones

```css
/* Variantes */
.btn-primary {
  background: var(--primary-600);
  color: white;
  border: none;
}

.btn-primary:hover {
  background: var(--primary-700);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  background: var(--primary-800);
  box-shadow: var(--shadow-sm);
}

.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}

.btn-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}

.btn-ghost {
  background: transparent;
  color: var(--gray-600);
}

.btn-ghost:hover {
  background: var(--gray-100);
}
```

### Cards

```css
.card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-xl);
  padding: var(--card-padding);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--gray-300);
}
```

### Inputs

```css
.input {
  height: var(--input-height);
  padding: var(--input-padding-y) var(--input-padding-x);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  background: white;
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary-600);
  ring: 3px solid var(--primary-100);
}

.input:disabled {
  background: var(--gray-100);
  color: var(--gray-500);
  cursor: not-allowed;
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: 1;
}

.badge-success {
  background: var(--success-100);
  color: var(--success-700);
}

.badge-warning {
  background: var(--warning-100);
  color: var(--warning-700);
}

.badge-error {
  background: var(--error-100);
  color: var(--error-700);
}

.badge-info {
  background: var(--info-100);
  color: var(--info-700);
}
```

---

## 9. 🏆 UX ADMINISTRATIVO PREMIUM

### Principios de Diseño:

1. **Información a golpe de vista**: Dashboards con KPIs claros
2. **Acciones rápidas**: Botones de acción siempre visibles
3. **Feedback inmediato**: Confirmaciones, loaders, toasts
4. **Jerarquía clara**: Lo importante arriba y grande
5. **Escaneabilidad**: Usuarios leen en F, acomodar contenido
6. **Densidad balanceada**: Ni muy apretado ni muy espacioso
7. **Consistencia**: Mismo patrón = menos carga cognitiva

### Referencias Visuales (Inspiración):
- **Linear**: Tipografía, espaciados
- **Vercel Dashboard**: Sombras sutiles, cards
- **Stripe Dashboard**: Tablas, datos financieros
- **Notion**: Sidebar, navegación
- **Figma**: Colores, estados

---

## 10. 📦 DESIGN TOKENS (CSS Variables)

```css
:root {
  /* Spacing */
  --space-0: 0;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Colors - Primary */
  --primary-600: #cf2d5d;
  --primary-700: #b11f48;
  --primary-800: #941d3e;
  --primary-900: #7d1d38;

  /* Colors - Gray */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-500: #6b7280;
  --gray-700: #374151;
  --gray-800: #1f2937;

  /* Colors - Success */
  --success-100: #dcfce7;
  --success-500: #22c55e;
  --success-700: #15803d;

  /* Colors - Warning */
  --warning-100: #fef3c7;
  --warning-500: #f59e0b;
  --warning-700: #b45309;

  /* Colors - Error */
  --error-100: #fee2e2;
  --error-500: #ef4444;
  --error-700: #b91c1c;

  /* Typography */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05);

  /* Component Dimensions */
  --navbar-height: 64px;
  --sidebar-width: 256px;
  --input-height: 40px;
  --btn-md-height: 40px;
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Actualizar theme.css con nuevos tokens
- [ ] Aplicar sombras a cards y modales
- [ ] Unificar border-radius en todos los componentes
- [ ] Actualizar colores de estados (success, warning, error)
- [ ] Ajustar espaciados siguiendo escala
- [ ] Revisar tamaños de iconos (consistencia)
- [ ] Actualizar tipografía (tamaños y pesos)
- [ ] Añadir transiciones suaves (0.2s ease)
- [ ] Mejorar contraste de textos (WCAG AA mínimo)
- [ ] Implementar hover/active states en botones
- [ ] Añadir focus rings accesibles en inputs
- [ ] Responsive: sidebar collapse en mobile

---

**Resultado Esperado:** Sistema visual profesional, consistente, accesible y moderno tipo SaaS Premium.
