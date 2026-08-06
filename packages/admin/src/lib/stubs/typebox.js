// Stub for the optional `typebox` peer of sveltekit-superforms.
//
// superforms' adapter barrel (`sveltekit-superforms/adapters`) statically
// re-exports every adapter, and `adapters/typebox.js` does a top-level
// `class TDate extends Type.Base` against `import Type from 'typebox'`. We use
// the zod4 adapter, not TypeBox, and don't have `typebox` installed. In a Vite
// dev SSR graph the unresolved bare import resolves to `undefined`, so
// `extends Type.Base` throws "Class extends value undefined" and 500s the page.
// (The prod build tree-shakes the unused adapter, which is why `build` passes
// but `dev` did not.)
//
// Every other adapter only touches its (missing) lib inside functions we never
// call, so returning a class for `Base` is all that's needed for the barrel to
// finish loading. See packages/admin/vite.config.ts for the alias.
export default { Base: class {} };
