import { useEffect, useState, type FormEvent } from 'react';
import {
  addSubcategory,
  createCategory,
  deleteCategory,
  removeSubcategory,
  subscribeCategories,
} from '../../lib/categories';
import type { Category } from '../../types';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [subcategoryDrafts, setSubcategoryDrafts] = useState<Record<string, string>>({});

  useEffect(() => subscribeCategories(setCategories), []);

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      alert(`"${name}" already exists.`);
      return;
    }
    await createCategory(name);
    setNewCategory('');
  }

  async function handleDeleteCategory(c: Category) {
    if (confirm(`Delete category "${c.name}" and all its subcategories? This cannot be undone.`)) {
      await deleteCategory(c.id);
    }
  }

  async function handleAddSubcategory(c: Category, e: FormEvent) {
    e.preventDefault();
    const draft = (subcategoryDrafts[c.id] ?? '').trim();
    if (!draft) return;
    if (c.subcategories.some((s) => s.toLowerCase() === draft.toLowerCase())) {
      alert(`"${draft}" already exists under "${c.name}".`);
      return;
    }
    await addSubcategory(c.id, draft);
    setSubcategoryDrafts((prev) => ({ ...prev, [c.id]: '' }));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-800">Categories</h1>

      <form onSubmit={handleAddCategory} className="card flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className="input flex-1"
          placeholder="New category name, e.g. Audio"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button type="submit" className="btn-primary whitespace-nowrap">
          + Add Category
        </button>
      </form>

      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-slate-800">{c.name}</h2>
              <button className="text-sm text-red-600 hover:underline" onClick={() => handleDeleteCategory(c)}>
                Delete
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {c.subcategories.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium"
                >
                  {s}
                  <button
                    className="text-slate-400 hover:text-red-600 leading-none"
                    onClick={() => removeSubcategory(c.id, s)}
                    aria-label={`Remove ${s}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
              {c.subcategories.length === 0 && (
                <span className="text-xs text-slate-400">No subcategories yet.</span>
              )}
            </div>

            <form onSubmit={(e) => handleAddSubcategory(c, e)} className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="New subcategory"
                value={subcategoryDrafts[c.id] ?? ''}
                onChange={(e) => setSubcategoryDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
              />
              <button type="submit" className="btn-secondary whitespace-nowrap text-sm">
                Add
              </button>
            </form>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center text-slate-400 py-8">No categories yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}
