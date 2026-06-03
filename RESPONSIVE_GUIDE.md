# 📱 RESPONSIVE DESIGN GUIDE - COMPLET

Dernière mise à jour: 26 Mai 2026

## Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Responsive](#architecture)
3. [Composants Créés](#composants)
4. [Adaptation des Pages](#adaptation)
5. [Patterns & Bonnes Pratiques](#patterns)
6. [Examples Complets](#exemples)
7. [Checklist Finale](#checklist)

---

## Vue d'ensemble

✅ **Responsive Design - Complètement Implémenté**

Le projet DG Business dispose maintenant d'une architecture responsive complète:

- **Sidebar** auto-responsive (desktop visible, mobile hamburger)
- **Modals centrées** sur tous les écrans
- **Layout responsive** avec MainLayout wrapper
- **Composants réutilisables** (FormModal, DeleteConfirmModal, CenteredModal)
- **Mobile-first design** avec proper spacing
- **iOS zoom prevention** (font-size 16px inputs)
- **Touch-friendly targets** (44x44px minimum)

---

## Architecture

### Structure Globale

```
Root Layout (layout.tsx)
├── Sidebar (auto-responsive)
├── MainLayout (gère offset + spacing)
└── Page Component
    ├── FormModal (ajouter/modifier)
    ├── DeleteConfirmModal (supprimer)
    └── CenteredModal (vues)
```

### Breakpoints

| Écran | Classe | Sidebar | Contenu |
|-------|--------|---------|---------|
| Mobile | < 768px | Hamburger | Full width |
| Tablet | 768-1024px | Visible | ml-64 |
| Desktop | > 1024px | Visible | ml-64 |

### Flow d'une Requête

```
Utilisateur visite page
  ↓
layout.tsx charge Sidebar + MainLayout
  ↓
Page component réside dans MainLayout
  ↓
Page utilise FormModal/DeleteConfirmModal
  ↓
Mobile: Modals centrées, full width, hamburger menu
Desktop: Modals centrées, ml-64, sidebar visible
```

---

## Composants Créés

### 1. **Sidebar.tsx** - Navigation Responsive

**Lieu**: `src/components/Sidebar.tsx`

**Utilisation**: Automatique dans `layout.tsx` - AUCUNE modification nécessaire

**Comportement**:
- **Desktop (md+)**: Sidebar fixe à gauche 300px
- **Mobile**: Hamburger menu > drawer slide-left
- Menu items: Dashboard, Ventes, Stock, Dépenses, Rapports
- Active page highlight avec chevron
- Settings + Logout buttons
- Animations avec Framer Motion

**Props**: Aucune - composant standalone

### 2. **MainLayout.tsx** - Gestion du Layout

**Lieu**: `src/components/MainLayout.tsx`

**Utilisation**: Automatique (wraps `{children}` dans `layout.tsx`)

**Responsabilités**:
- Ajoute `md:ml-64` (offset sidebar)
- Ajoute `pb-20 md:pb-8` (bottom spacing)
- Cache offset sur pages auth

**Props**:
- `children`: ReactNode

### 3. **CenteredModal.tsx** - Modal Générique

**Lieu**: `src/components/CenteredModal.tsx`

**Utilisation**: Contenu statique ou vues

```tsx
import CenteredModal from "@/components/CenteredModal";

<CenteredModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Détails"
  size="md"
>
  <div>
    <p>Contenu quelconque</p>
  </div>
</CenteredModal>
```

**Props**:
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: "sm" | "md" | "lg" | "xl"
- `children`: ReactNode

**Sizes**:
- `sm`: 384px
- `md`: 448px (recommended)
- `lg`: 512px
- `xl`: 600px

### 4. **FormModal.tsx** - Modal avec Formulaire

**Lieu**: `src/components/FormModal.tsx`

**Utilisation**: Formulaires Add/Edit

```tsx
import FormModal from "@/components/FormModal";

<FormModal
  isOpen={isFormOpen}
  onClose={() => setIsFormOpen(false)}
  title={isEditing ? "Modifier" : "Ajouter"}
  onSubmit={handleSubmit}
  submitButtonText="Ajouter"
  isLoading={isLoading}
  size="md"
>
  <input type="text" placeholder="Nom" />
  <input type="number" placeholder="Montant" />
</FormModal>
```

**Props**:
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `onSubmit`: (e: FormEvent) => Promise<void>
- `submitButtonText`: string (défaut: "Enregistrer")
- `isLoading`: boolean
- `size`: "sm" | "md" | "lg"
- `children`: ReactNode (form content)

**Features**:
- Boutons Cancel/Submit automatics
- Loading state (buttons disabled)
- Space-y entre inputs
- Enter key support

### 5. **DeleteConfirmModal.tsx** - Modal de Confirmation

**Lieu**: `src/components/DeleteConfirmModal.tsx`

**Utilisation**: Confirmations destructives

```tsx
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

<DeleteConfirmModal
  isOpen={isDeleteOpen}
  onClose={() => setIsDeleteOpen(false)}
  title="Supprimer cet article?"
  message="Cette action ne peut pas être annulée."
  onConfirm={handleDelete}
  isLoading={isLoading}
  confirmButtonText="Supprimer"
/>
```

**Props**:
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `message`: string
- `onConfirm`: () => Promise<void>
- `isLoading`: boolean
- `confirmButtonText`: string (défaut: "Supprimer")

**Features**:
- Design distinctif rouge
- Icône trash LuTrash2
- Clear warning message

---

## Adaptation des Pages Existantes

### Checklist Adaptation

- [ ] Importer FormModal + DeleteConfirmModal
- [ ] Remplacer tous les `<AnimatePresence>` modals
- [ ] Ajouter `pb-24 md:pb-8` au div racine
- [ ] Vérifier responsive mobile
- [ ] Tester form submission
- [ ] Build avec `npm run build`

### Étape 1: Imports

**Ajouter au top du fichier**:

```tsx
import FormModal from "@/components/FormModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
```

### Étape 2: Remplacer Modal Add/Edit

**AVANT** (Ancien Pattern):

```tsx
<AnimatePresence>
  {showForm && (
    <motion.div className="fixed inset-0 z-50">
      <motion.div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => setShowForm(false)} 
      />
      <motion.div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6">
        <h2>Ajouter un article</h2>
        <input type="text" placeholder="Nom" />
        <button onClick={handleAdd}>Ajouter</button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

**APRÈS** (Nouveau Pattern):

```tsx
<FormModal
  isOpen={showForm}
  onClose={() => setShowForm(false)}
  title="Ajouter un article"
  onSubmit={handleSubmit}
  size="md"
>
  <input type="text" placeholder="Nom" />
</FormModal>
```

### Étape 3: Remplacer Modal de Suppression

**AVANT**:

```tsx
<AnimatePresence>
  {showDelete && (
    <motion.div className="fixed inset-0 z-50">
      <p>Êtes-vous sûr?</p>
      <button onClick={handleDelete}>Supprimer</button>
    </motion.div>
  )}
</AnimatePresence>
```

**APRÈS**:

```tsx
<DeleteConfirmModal
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
  title="Supprimer cet article?"
  message="Cette action est irréversible..."
  onConfirm={handleDelete}
/>
```

### Étape 4: Adapter Layout du Div Principal

**AVANT**:

```tsx
<div className="px-4 py-6">
  {/* Contenu */}
</div>
```

**APRÈS**:

```tsx
<div className="px-4 py-6 pb-24 md:pb-8">
  {/* Contenu */}
</div>
```

**Explications**:
- `pb-24`: Bottom padding 6rem (mobile, évite menu bottom)
- `md:pb-8`: Bottom padding 2rem (desktop, pas besoin pour menu)

---

## Patterns & Bonnes Pratiques

### State Management Pattern

```tsx
// Items
const [items, setItems] = useState<Item[]>([]);

// Modals
const [isFormOpen, setIsFormOpen] = useState(false);
const [isDeleteOpen, setIsDeleteOpen] = useState(false);
const [isViewOpen, setIsViewOpen] = useState(false);

// Loading/Selected
const [isLoading, setIsLoading] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

// Form data
const [formData, setFormData] = useState({
  name: "",
  description: "",
  amount: "",
});

// Reset helper
const resetForm = () => {
  setFormData({ name: "", description: "", amount: "" });
  setSelectedItem(null);
};
```

### Form Submission Pattern

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const token = localStorage.getItem("token");
    const method = selectedItem ? "PUT" : "POST";
    const url = selectedItem 
      ? `/api/endpoint/${selectedItem.id}` 
      : "/api/endpoint";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error("API error");

    // Refresh data
    const res = await fetch("/api/endpoint", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems(await res.json());

    resetForm();
    setIsFormOpen(false);
  } catch (error) {
    console.error(error);
    showNotification("error", "Une erreur s'est produite");
  } finally {
    setIsLoading(false);
  }
};
```

### Delete Pattern

```tsx
const handleDelete = async () => {
  if (!selectedItem) return;
  setIsLoading(true);

  try {
    const token = localStorage.getItem("token");
    await fetch(`/api/endpoint/${selectedItem.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
    setIsDeleteOpen(false);
    setSelectedItem(null);
    showNotification("success", "Supprimé avec succès");
  } catch (error) {
    showNotification("error", "Erreur lors de la suppression");
  } finally {
    setIsLoading(false);
  }
};
```

### Notification Pattern

```tsx
const [notification, setNotification] = useState<{
  type: "success" | "error";
  message: string;
} | null>(null);

const showNotification = (type: "success" | "error", message: string) => {
  setNotification({ type, message });
  setTimeout(() => setNotification(null), 3000);
};

// Render
{notification && (
  <motion.div
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
      notification.type === "success" ? "bg-green-600" : "bg-red-600"
    }`}
  >
    {notification.message}
  </motion.div>
)}
```

### Responsive Layout Patterns

```tsx
// Header responsive
<header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
  <h1 className="text-2xl md:text-4xl font-bold">Titre</h1>
  <button className="w-full sm:w-auto px-4 py-2">Action</button>
</header>

// Table responsive
<div className="bg-white rounded-lg overflow-x-auto">
  <table className="w-full min-w-[600px]">
    {/* Table */}
  </table>
</div>

// Grid responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

---

## Exemples Complets

### Exemple 1: Page Dépenses Complète

Voir `src/app/exemple-page-adaptee/page.tsx` pour exemple complet avec:
- FormModal pour add/edit
- DeleteConfirmModal pour delete
- Table responsive
- Notifications
- Loading states

### Exemple 2: Structure Minimale

```tsx
"use client";

import { useState } from "react";
import FormModal from "@/components/FormModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function Page() {
  const [items, setItems] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // API call
    setIsLoading(false);
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    // API call
    setIsLoading(false);
    setIsDeleteOpen(false);
  };

  return (
    <div className="px-4 py-6 pb-24 md:pb-8">
      <button onClick={() => setIsFormOpen(true)}>Ajouter</button>

      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Ajouter"
        onSubmit={handleSubmit}
        isLoading={isLoading}
      >
        <input type="text" placeholder="Nom" />
      </FormModal>

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
```

---

## Checklist Finale

Avant de merger une page adaptée:

### Code Quality
- [ ] Imports FormModal + DeleteConfirmModal présents
- [ ] Layout: `pb-24 md:pb-8` sur div racine
- [ ] Toutes les modals remplacées par FormModal/DeleteConfirmModal
- [ ] Build: `npm run build` réussit sans erreurs
- [ ] TypeScript: Aucune erreur de type

### Responsive Testing
- [ ] Mobile (375px): Modals centrées, menu hamburger visible
- [ ] Tablet (768px): Sidebar visible, layout correct
- [ ] Desktop (1920px): Sidebar visible, layout complet
- [ ] Inputs: Font-size 16px mobile, 14px desktop
- [ ] Buttons: Min 44x44px sur mobile

### Functionality
- [ ] Add/Edit form fonctionne
- [ ] Delete confirmation fonctionne
- [ ] API calls incluent Bearer token
- [ ] Notifications s'affichent
- [ ] Loading states visibles

### Accessibility
- [ ] Modals fermables (Escape key)
- [ ] Modals fermables (backdrop click)
- [ ] Inputs accessibles
- [ ] Buttons accessibles
- [ ] Contrast colors OK

---

## Pages à Adapter

### Priorité 1 (Peu de modals)
1. ✏️ `/depenses` - Quelques modals simples
2. ✏️ `/dettes` - Quelques modals simples
3. ✏️ `/rapports` - Modals avec signature

### Priorité 2 (Modals complexes)
4. ✏️ `/stock` - Plusieurs modals, tables complexes
5. ✏️ `/ventes` - Signatures, receipts

---

## Support & Débogage

### Common Issues

**Problème**: Modal ne s'affiche pas
- ✓ Vérifier `isOpen={isOpen}`
- ✓ Vérifier import du composant
- ✓ Vérifier state management

**Problème**: Formulaire ne submit pas
- ✓ Vérifier handler `onSubmit`
- ✓ Vérifier form inputs dans children
- ✓ Vérifier Bearer token dans headers

**Problème**: Layout décalé
- ✓ Vérifier `pb-24 md:pb-8` sur div racine
- ✓ Vérifier MainLayout wrapping
- ✓ Vérifier max-w-7xl

**Problème**: Mobile zoom sur inputs
- ✓ Vérifier font-size 16px sur inputs
- ✓ Vérifier input min-height 44px
- ✓ Vérifier globals.css loaded

---

## Ressources

- Exemple complet: [src/app/exemple-page-adaptee/page.tsx](../src/app/exemple-page-adaptee/page.tsx)
- Composants: [src/components/](../src/components/)
- Styles globaux: [src/app/globals.css](../src/app/globals.css)
- Résumé: [RESPONSIVE_SUMMARY.md](../RESPONSIVE_SUMMARY.md)

---

**Date**: 26 Mai 2026 | **Status**: ✅ Production-Ready
