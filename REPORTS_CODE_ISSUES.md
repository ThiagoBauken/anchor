# Reports Tab - Detailed Code Issues & Fixes

## Issue 1: Critical DOM Element ID Mismatch

### Location
**File**: `src/components/map-tab.tsx`
**Lines**: 158-160

### Current Code (BROKEN)
```typescript
const handleSelectFloorPlan = (floorPlanId: string | null) => {
    const selectedFloorPlan = floorPlanId ? (floorPlans || []).find(fp => fp.id === floorPlanId) || null : null;
    setCurrentFloorPlan(selectedFloorPlan);
    if (onActiveFloorPlanChange && selectedFloorPlan) {
        onActiveFloorPlanChange(selectedFloorPlan.image);  // ❌ WRONG: Passes image URL
    }
};
```

### The Problem
- Passes `selectedFloorPlan.image` (a base64 data URL or image path)
- ReportsTab stores this as `activeFloorPlan`
- export.ts tries: `document.getElementById(`export-map-${activeFloorPlan}`)`
- Results in invalid selector like: `getElementById("export-map-data:image/png;base64,iVBORw0K...")`
- Returns `null`, so map is never captured
- PDF/DOCX exports without floor plan visualization

### Fix
```typescript
const handleSelectFloorPlan = (floorPlanId: string | null) => {
    const selectedFloorPlan = floorPlanId ? (floorPlans || []).find(fp => fp.id === floorPlanId) || null : null;
    setCurrentFloorPlan(selectedFloorPlan);
    if (onActiveFloorPlanChange && selectedFloorPlan) {
        onActiveFloorPlanChange(selectedFloorPlan.id);  // ✅ CORRECT: Pass ID instead
    }
};
```

### Impact
- ✅ Export.ts can now find the element: `getElementById("export-map-fp_a1b2c3d4")`
- ✅ Floor plan map is captured correctly
- ✅ PDF/DOCX reports include map visualization

---

## Issue 2: ReportsTab Type Mismatch

### Location
**File**: `src/components/reports-tab.tsx`
**Lines**: 83 & 156

### Current Code (PROBLEMATIC)
```typescript
// Line 83: Initializes to image URL from project
const [activeFloorPlan, setActiveFloorPlan] = useState(
    currentProject?.floorPlanImages?.[0] || ''
);

// Line 156: Passes to export function
await exportToWord(currentProject, points, tests, users, null, exportName, activeFloorPlan);
// activeFloorPlan is image URL string here
```

### The Problem
- State name suggests it should hold a floor plan object or ID
- Actually holds an image URL string
- Confusing semantics for future maintainers
- Type is inconsistent with how it's used in export.ts

### Fix (Better Approach)
```typescript
// Track both floor plan ID and image separately
const [activeFloorPlanId, setActiveFloorPlanId] = useState<string | null>(null);

useEffect(() => {
    // Auto-select first floor plan when component mounts or project changes
    if (currentFloorPlans?.length > 0 && !activeFloorPlanId) {
        setActiveFloorPlanId(currentFloorPlans[0].id);
    }
}, [currentFloorPlans, activeFloorPlanId]);

// Pass the ID to export functions
await exportToWord(currentProject, points, tests, users, null, exportName, activeFloorPlanId);
await generatePdfReport(currentProject, points, tests, users, null, activeFloorPlanId);
```

### Impact
- ✅ Type safety - activeFloorPlanId is clearly an ID
- ✅ Semantic correctness - variable name matches actual data
- ✅ Easier debugging and maintenance

---

## Issue 3: export.ts Invalid DOM Query

### Location
**File**: `src/lib/export.ts`
**Lines**: 123-124

### Current Code (BROKEN)
```typescript
const mapElement = activeFloorPlan ? document.getElementById(`export-map-${activeFloorPlan}`) : null;
let mapImage = '';
if (mapElement) {
    // ... generates map image
} else {
    console.warn('Map element for export not found. Active floor plan:', activeFloorPlan);
}
```

### The Problem
When `activeFloorPlan` is an image URL:
```
activeFloorPlan = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk"
document.getElementById("export-map-data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk")
// ❌ Invalid ID selector with special characters
// ❌ Returns null
// ❌ mapImage stays empty
```

### Fix (No changes needed here!)
Once Issue 1 is fixed, this code will work correctly:
```
activeFloorPlanId = "fp_a1b2c3d4"
document.getElementById("export-map-fp_a1b2c3d4")
// ✅ Valid ID selector
// ✅ Finds the element
// ✅ mapImage is generated correctly
```

---

## Issue 4: Type Ambiguity in Export Function Signature

### Location
**File**: `src/lib/export.ts`
**Lines**: 62, 212, 462

### Current Code
```typescript
export const generatePdfReport = async (
    project: Project, 
    points: AnchorPoint[], 
    tests: AnchorTest[], 
    users: User[], 
    logoDataUrl: string | null, 
    activeFloorPlan: string | null  // ❌ Could be ID or URL!
) => { ... }

export const exportToWord = async (
    project: Project, 
    points: AnchorPoint[], 
    tests: AnchorTest[], 
    users: User[], 
    logoDataUrl: string | null, 
    fileName: string, 
    activeFloorPlan: string | null  // ❌ Could be ID or URL!
) => { ... }
```

### The Problem
- Parameter type `string | null` doesn't indicate what kind of string
- Could be floor plan ID, image URL, or filename
- Makes the function fragile and confusing

### Fix (Better Type Clarity)
```typescript
export const generatePdfReport = async (
    project: Project, 
    points: AnchorPoint[], 
    tests: AnchorTest[], 
    users: User[], 
    logoDataUrl: string | null, 
    activeFloorPlanId: string | null  // ✅ Clearly an ID
) => { ... }

export const exportToWord = async (
    project: Project, 
    points: AnchorPoint[], 
    tests: AnchorTest[], 
    users: User[], 
    logoDataUrl: string | null, 
    fileName: string, 
    activeFloorPlanId: string | null  // ✅ Clearly an ID
) => { ... }

// And update the function body:
const mapElement = activeFloorPlanId ? 
    document.getElementById(`export-map-${activeFloorPlanId}`) : null;
```

---

## Issue 5: Incomplete Point Status Check (Minor)

### Location
**File**: `src/lib/export.ts`
**Line**: 464

### Current Code
```typescript
const allApproved = points.length > 0 && points.every(p => p.status === 'Aprovado');
// ❌ points don't have a 'status' property!
```

### The Problem
- `AnchorPoint` type doesn't have a `status` property
- Status comes from `AnchorTest` results
- This will always evaluate to `false`
- Minor issue - doesn't break export, just logic error

### Fix
```typescript
const allApproved = points.length > 0 && 
    points.every(p => {
        const test = tests.find(t => t.pontoId === p.id);
        return test?.resultado === 'Aprovado';
    });
```

Or simpler:
```typescript
const approvedCount = tests.filter(t => t.resultado === 'Aprovado').length;
const allApproved = points.length > 0 && approvedCount === points.length;
```

---

## Issue 6: Watermark Feature Disabled

### Location
**File**: `src/lib/export.ts`
**Lines**: 195-209 (PDF), 438-459 (DOCX)

### Current Code
```typescript
// Line 156 in ReportsTab:
await exportToWord(currentProject, points, tests, users, null, exportName, activeFloorPlan);
                                                         // ☝️ Always null!

// In export.ts:
export const generatePdfReport = async (
    project: Project, 
    points: AnchorPoint[], 
    tests: AnchorTest[], 
    users: User[], 
    logoDataUrl: string | null,  // Always null from ReportsTab
    activeFloorPlan: string | null
) => {
    // ...
    if (logoDataUrl) {
        addWatermark(doc, logoDataUrl);  // Never executes
    }
}
```

### The Problem
- Watermark code exists but never used (logoDataUrl always null)
- Professional reports could benefit from watermarks
- Code is dead/unused

### Fix Option 1: Use Company Logo (if available)
```typescript
// In ReportsTab:
const companyLogo = currentUser?.company?.logoUrl || null;
await exportToWord(currentProject, points, tests, users, companyLogo, exportName, activeFloorPlanId);
```

### Fix Option 2: Generate Default Watermark
```typescript
// In export.ts:
const defaultWatermark = 'AnchorView'; // Already done in addWatermark
// Use watermark even without logo
addWatermark(doc, null);  // Modify function to work without logo
```

---

## Issue 7: Missing Project Data Filtering

### Location
**File**: `src/components/reports-tab.tsx`
**Lines**: 18-22

### Current Code
```typescript
// Get all points from all projects for the global stats
const allPoints = points;  // ❌ This is literally the same as...

// Points filtered by current project
const projectPoints = points;  // ❌ ...this. No filtering happens!
```

### The Problem
- If context provides pre-filtered data, might be okay
- But semantically wrong - suggests points are filtered when they're not
- Could break if context behavior changes
- Confusing for readers

### Fix (If context doesn't pre-filter)
```typescript
// Points for all projects (use context data as-is)
const allPoints = points;

// Points filtered by current project
const projectPoints = currentProject 
    ? points.filter(p => p.projectId === currentProject.id)
    : [];

const projectTests = tests.filter(t => 
    projectPoints.some(p => p.id === t.pontoId)
);
```

---

## Issue 8: State Not Synced on Project Change

### Location
**File**: `src/components/reports-tab.tsx`
**Lines**: 83-84

### Current Code
```typescript
const [activeFloorPlan, setActiveFloorPlan] = useState(
    currentProject?.floorPlanImages?.[0] || ''
);
```

### The Problem
- Initializes only once on mount
- If user switches projects, activeFloorPlan doesn't reset
- Reports might use floor plan from previous project
- Could show wrong map for new project

### Fix
```typescript
const [activeFloorPlanId, setActiveFloorPlanId] = useState<string | null>(null);

// Sync with project changes
useEffect(() => {
    if (currentProject && floorPlans && floorPlans.length > 0) {
        setActiveFloorPlanId(floorPlans[0].id);
    } else {
        setActiveFloorPlanId(null);
    }
}, [currentProject?.id]);  // Reset when project changes
```

---

## Issue 9: No Error Boundary for Large Files

### Location
**File**: `src/lib/export.ts`
**Multiple locations**

### The Problem
- `html-to-image` may timeout on very large floor plans
- `docx` library may crash with 1000+ images
- Large projects could cause browser memory exhaustion
- No recovery mechanism

### Suggested Fix
```typescript
export const generatePdfReport = async (
    project: Project, 
    points: AnchorPoint[], 
    tests: AnchorTest[], 
    users: User[], 
    logoDataUrl: string | null, 
    activeFloorPlanId: string | null,
    onProgress?: (stage: string) => void
) => {
    try {
        onProgress?.('Collecting data...');
        const { reportDataByLocation, mapImage, locationOrder } = 
            await Promise.race([
                getDataAndPhotos(project, points, tests, activeFloorPlanId),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 30000)
                )
            ]);

        onProgress?.('Generating PDF...');
        const doc = new jsPDF({ ... });
        
        // ... rest of generation ...
        
        onProgress?.('Saving file...');
        doc.save(`${project.name.replace(/\s+/g, '_') || 'relatorio'}_tecnico.pdf`);
    } catch (error) {
        if (error instanceof Error && error.message === 'Timeout') {
            throw new Error('Report generation timed out. Try with fewer points.');
        }
        throw error;
    }
};
```

---

## Summary of All Issues

| # | Issue | Severity | File | Lines | Fix Effort |
|---|-------|----------|------|-------|-----------|
| 1 | DOM ID Mismatch | CRITICAL | map-tab.tsx | 158-160 | 5 min |
| 2 | Type Mismatch | HIGH | reports-tab.tsx | 83, 156 | 10 min |
| 3 | Invalid DOM Query | CRITICAL | export.ts | 123 | Fixed by #1 |
| 4 | Type Ambiguity | MEDIUM | export.ts | 62, 212, 462 | 10 min |
| 5 | Status Check Logic | LOW | export.ts | 464 | 5 min |
| 6 | Watermark Disabled | MEDIUM | both files | various | 10 min |
| 7 | Missing Filtering | MEDIUM | reports-tab.tsx | 18-22 | 10 min |
| 8 | State Not Synced | MEDIUM | reports-tab.tsx | 83-84 | 10 min |
| 9 | No Timeout Handling | MEDIUM | export.ts | multiple | 20 min |

**Total estimated fix time**: 1.5 - 2 hours for complete fixes
**Critical fixes only**: 15-30 minutes

