import type { FormFieldWithId } from "../../forms/form-context"

export function reorderWithinSection(
  fields: FormFieldWithId[],
  draggedTempId: string,
  sourceIndex: number,
  destinationIndex: number
) {
  const draggedField = fields.find(f => f.tempId === draggedTempId)
  if (!draggedField) return fields

  const sameSection = (f: FormFieldWithId) => f.form_section_id === draggedField.form_section_id

  const sectionIndexes = fields
    .map((f, idx) => ({ f, idx }))
    .filter(({ f }) => sameSection(f))
    .map(({ idx }) => idx)

  const from = sectionIndexes[sourceIndex]
  const to = sectionIndexes[destinationIndex]
  if (from === undefined || to === undefined) return fields

  const next = [...fields]
  const sectionFields = sectionIndexes.map(i => next[i])
  const [moved] = sectionFields.splice(sourceIndex, 1)
  sectionFields.splice(destinationIndex, 0, moved)

  sectionIndexes.forEach((globalIdx, i) => {
    next[globalIdx] = { ...sectionFields[i], display_order: i }
  })

  return next
}


