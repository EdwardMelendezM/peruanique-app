# Skill: nextjs-table-filters-generator

## 🎯 Purpose
Crear un hook reutilizable para manejar ordenamiento y paginacion con query params en tablas.

## 📝 Execution Protocol
1. **Hook Reutilizable**: Usar `@/hooks/use-table-filters`.
2. **Sort Links**: Usar `sortLink(column)` para construir enlaces y mantener query params.
3. **Pagination**: Usar `safePage`, `totalPages` y `startIndex` para paginar.
4. **Page Param**: Respetar `page` como query param por defecto.

