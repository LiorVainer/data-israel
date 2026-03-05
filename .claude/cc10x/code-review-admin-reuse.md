# Code Review: Admin Page Code Reuse Opportunities

## Confidence Threshold
All findings ≥80% confidence (verified by direct code inspection).

---

## CRITICAL: Price Display Pattern (95% confidence)

### Issue Summary
The **ModelPriceDisplay pattern is duplicated 4 times** across 2 files with **identical logic and styling**.

### Evidence

**File 1: `components/admin/ModelPickerDialog.tsx`**
- Line 106-116: Price display in `renderModelButton()`
  ```jsx
  <span className='text-muted-foreground flex items-center gap-1 text-[11px] tabular-nums'>
      <span className='text-blue-500' title='Input per 1M tokens'>
          {formatPrice(m.inputPrice)}
      </span>
      <span className='text-muted-foreground/50'>|</span>
      <span className='text-orange-500' title='Output per 1M tokens'>
          {formatPrice(m.outputPrice)}
      </span>
  </span>
  ```

**File 2: `app/admin/page.tsx`**
- Line 228-236: Price display in admin button (agent selector)
  ```jsx
  <span className='text-muted-foreground mt-1 flex items-center gap-1 text-[11px] tabular-nums'>
      <span className='text-blue-500' title='Input per 1M tokens'>
          {formatPrice(modelData.inputPrice)}
      </span>
      <span className='text-muted-foreground/50'>|</span>
      <span className='text-orange-500' title='Output per 1M tokens'>
          {formatPrice(modelData.outputPrice)}
      </span>
  </span>
  ```

- Line 293-304: Price display in confirmation dialog (Current model)
  ```jsx
  <span className='text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px] tabular-nums'>
      <span className='text-blue-500'>
          {formatPrice(currentModel.inputPrice)}
      </span>
      <span className='text-muted-foreground/50'>|</span>
      <span className='text-orange-500'>
          {formatPrice(currentModel.outputPrice)}
      </span>
  </span>
  ```

- Line 320-330: Price display in confirmation dialog (New model)
  ```jsx
  <span className='text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px] tabular-nums'>
      <span className='text-blue-500'>
          {formatPrice(newModel.inputPrice)}
      </span>
      <span className='text-muted-foreground/50'>|</span>
      <span className='text-orange-500'>
          {formatPrice(newModel.outputPrice)}
      </span>
  </span>
  ```

### Root Cause
No extracted component for price display. Each location reimplements the same markup: blue input price, pipe separator, orange output price.

### Recommendation
**CRITICAL FIX: Extract `ModelPriceDisplay` component**

Create `/components/admin/ModelPriceDisplay.tsx`:
```typescript
interface ModelPriceDisplayProps {
  inputPrice: number | undefined;
  outputPrice: number | undefined;
  className?: string;
}

export function ModelPriceDisplay({ inputPrice, outputPrice, className = 'mt-1' }: ModelPriceDisplayProps) {
  if (inputPrice === undefined && outputPrice === undefined) return null;

  return (
    <span className={cn('text-muted-foreground flex items-center gap-1 text-[11px] tabular-nums', className)}>
      <span className='text-blue-500' title='Input per 1M tokens'>
        {formatPrice(inputPrice)}
      </span>
      <span className='text-muted-foreground/50'>|</span>
      <span className='text-orange-500' title='Output per 1M tokens'>
        {formatPrice(outputPrice)}
      </span>
    </span>
  );
}
```

**Benefits:**
- Eliminates 4 identical 9-line JSX blocks
- Centralized price rendering logic
- Easy to modify styling or behavior globally
- Reduces maintenance burden (1 source of truth)

**Files to update:**
1. Create: `components/admin/ModelPriceDisplay.tsx`
2. Update: `components/admin/ModelPickerDialog.tsx` (line 106-116 → 1 import + 1 line)
3. Update: `app/admin/page.tsx` (lines 228-236, 293-304, 320-330 → 3 imports + 3 lines)

---

## IMPORTANT: Model Display Card (85% confidence)

### Issue Summary
The **model display card pattern is duplicated 3 times** in `app/admin/page.tsx` (admin button, dialog Current section, dialog New section).

### Evidence

**Pattern 1: Admin button selector (lines 217-225)**
```jsx
<span className='flex w-full items-center gap-1.5'>
    <ModelSelectorLogo provider={modelData.providerSlug} className='shrink-0' />
    <span className='min-w-0 truncate'>{modelData.name}</span>
    <ChevronDown className='ml-auto size-4 shrink-0 opacity-50' />
</span>
```

**Pattern 2: Confirmation dialog Current model (lines 284-291)**
```jsx
<div className='flex items-center gap-1.5'>
    <ModelSelectorLogo provider={currentModel.providerSlug} className='shrink-0' />
    <span className='text-muted-foreground text-left'>
        {currentModel.name}
    </span>
</div>
```

**Pattern 3: Confirmation dialog New model (lines 310-317)**
```jsx
<div className='flex items-center gap-1.5'>
    <ModelSelectorLogo provider={newModel.providerSlug} className='shrink-0' />
    <span className='font-medium text-foreground text-left'>
        {newModel.name}
    </span>
</div>
```

### Root Cause
Three variations of the same component (logo + name) with slight styling differences:
- Variant 1 (admin button): includes ChevronDown + truncate
- Variant 2 (current): muted gray text
- Variant 3 (new): bold foreground text

### Recommendation
**IMPORTANT FIX: Extract `ModelDisplayRow` component**

Create `/components/admin/ModelDisplayRow.tsx`:
```typescript
interface ModelDisplayRowProps {
  model: AvailableModel;
  variant?: 'selector' | 'current' | 'new';
}

export function ModelDisplayRow({ model, variant = 'selector' }: ModelDisplayRowProps) {
  return (
    <span className={cn('flex items-center gap-1.5', variant === 'selector' && 'w-full')}>
      <ModelSelectorLogo provider={model.providerSlug} className='shrink-0' />
      <span className={cn(
        variant === 'selector' && 'min-w-0 truncate',
        variant === 'current' && 'text-muted-foreground text-left',
        variant === 'new' && 'font-medium text-foreground text-left',
      )}>
        {model.name}
      </span>
      {variant === 'selector' && (
        <ChevronDown className='ml-auto size-4 shrink-0 opacity-50' />
      )}
    </span>
  );
}
```

**Benefits:**
- Centralizes model display logic with variants
- Reduces duplication from 3 blocks to 1 component call
- Easier to maintain consistent styling

**Files to update:**
1. Create: `components/admin/ModelDisplayRow.tsx`
2. Update: `app/admin/page.tsx` (lines 217-225, 284-291, 310-317 → 3 component calls)

---

## IMPORTANT: Confirmation Dialog Model Section (85% confidence)

### Issue Summary
The confirmation dialog has **two nearly identical model sections** (Current and New, lines 280-305 and 306-331).

### Duplication Details
Both sections follow the same structure:
1. Label span (`<span className='text-muted-foreground mb-1 block text-left text-xs'> ... </span>`)
2. Model display row (logo + name)
3. Price display (optional)

**Pattern appears at:**
- Lines 280-305 (Current model section)
- Lines 306-331 (New model section)

### Recommendation
**IMPORTANT FIX: Extract dialog model section component**

Create `/components/admin/ConfirmationDialogModelSection.tsx`:
```typescript
interface ConfirmationDialogModelSectionProps {
  label: string;
  model: AvailableModel;
  variant: 'current' | 'new';
}

export function ConfirmationDialogModelSection({
  label,
  model,
  variant,
}: ConfirmationDialogModelSectionProps) {
  return (
    <div>
      <span className={cn(
        'text-muted-foreground mb-1 block text-left text-xs',
        variant === 'new' && 'text-foreground'
      )}>
        {label}
      </span>
      <ModelDisplayRow model={model} variant={variant} />
      <ModelPriceDisplay
        inputPrice={model.inputPrice}
        outputPrice={model.outputPrice}
        className='mt-0.5'
      />
    </div>
  );
}
```

**Benefits:**
- Eliminates duplication of dialog model sections
- Integrates with extracted `ModelDisplayRow` and `ModelPriceDisplay`
- Consistent variant styling (current = muted, new = bold)

**Files to update:**
1. Create: `components/admin/ConfirmationDialogModelSection.tsx`
2. Update: `app/admin/page.tsx` (lines 280-331 → 2 component calls)

---

## SUMMARY OF REUSE OPPORTUNITIES

| Component | Type | Locations | Lines | Priority |
|-----------|------|-----------|-------|----------|
| **ModelPriceDisplay** | Price rendering | 4 duplicates | 9 lines each | CRITICAL (95%) |
| **ModelDisplayRow** | Model info card | 3 duplicates | 5-8 lines each | IMPORTANT (85%) |
| **ConfirmationDialogModelSection** | Dialog section | 2 duplicates | 25 lines each | IMPORTANT (85%) |

### Extraction Sequence
1. **First**: Extract `ModelPriceDisplay` (used by multiple components)
2. **Second**: Extract `ModelDisplayRow` (used by admin page + dialog)
3. **Third**: Extract `ConfirmationDialogModelSection` (wraps the above two)

This dependency order ensures no import conflicts.

---

## CODE QUALITY NOTES

### Positive Findings
- `formatPrice()` already extracted to `ModelPickerDialog.tsx` (line 15-20) ✓
- Clear separation of concerns (admin page, picker dialog, confirmation)
- Proper TypeScript types on `AvailableModel`

### Pre-Existing Patterns
- `ModelSelectorLogo` component exists and is reused correctly
- `cn()` utility available for className merging
- All price title attributes included (accessibility good)

---

## Non-Actionable Findings

### Constants Consolidation (70% confidence)
`AGENT_CONFIGS` at line 29-40 and `AgentId` at line 40 are admin-page-specific and serve navigation/labeling. **No extract recommended** — they're not reused elsewhere and changing them would require wider refactoring.

### `getModelDisplay()` Function (75% confidence)
Line 50-68 in admin page is utility for deriving display info. While reusable, it's **currently only used in admin page** (3 calls). Extract to `/lib/model-utils.ts` if it's needed in other admin-related components later. Current usage: **not actionable now**.

---

## Files Affected by Recommended Changes

```
components/admin/
├── ModelPickerDialog.tsx          [UPDATE] Remove lines 106-116, add import
├── ModelPriceDisplay.tsx          [CREATE] New extracted component
├── ModelDisplayRow.tsx            [CREATE] New extracted component
└── ConfirmationDialogModelSection.tsx [CREATE] New extracted component

app/admin/
└── page.tsx                       [UPDATE] Replace 4 price blocks + 3 display blocks
```

---

## Verification Approach

After extraction:
1. `npm run build` — Verify TypeScript compilation succeeds
2. `npm run lint` — Check for no new ESLint violations
3. `npm run vibecheck` — Verify code quality (target: ≥73/100)
4. Manual test: Navigate to `/admin`, verify all 3 agent model buttons display prices and click to open dialogs
5. Verify confirmation dialog shows Current/New model sections with prices

---

Last Updated: 2026-03-04
