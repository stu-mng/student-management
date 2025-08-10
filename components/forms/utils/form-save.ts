import type { FormFieldWithId, FormSectionWithId } from "../../forms/form-context"

interface BuildPayloadArgs {
  title: string
  description: string
  formType: string
  isRequired: boolean
  allowMultipleSubmissions: boolean
  submissionDeadline?: Date
  status: 'draft' | 'active'
  sections: FormSectionWithId[]
  fields: FormFieldWithId[]
  resolveSectionId: (tempIdOrId: string) => string | undefined
}

export function buildFormPayload({
  title,
  description,
  formType,
  isRequired,
  allowMultipleSubmissions,
  submissionDeadline,
  status,
  sections,
  fields,
  resolveSectionId,
}: BuildPayloadArgs) {
  const activeFields = fields.filter(f => f.is_active !== false)

  // Compute a single increasing global display order across all sections to preserve UI order
  let globalDisplayOrder = 0

  return {
    title,
    description,
    form_type: formType,
    is_required: isRequired,
    allow_multiple_submissions: allowMultipleSubmissions,
    submission_deadline: submissionDeadline?.toISOString(),
    status,
    sections: sections.map((section, sectionIndex) => {
      const sectionFields = activeFields
        .filter(field =>
          field.form_section_id === section.id ||
          field.form_section_id === section.tempId ||
          (!field.form_section_id && section.order === 0)
        )
        .sort((a, b) => a.display_order - b.display_order)
        .map(field => ({
          id: field.id,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          display_order: globalDisplayOrder++,
          is_required: field.is_required,
          is_active: field.is_active,
          placeholder: field.placeholder || '',
          help_text: field.help_text || '',
          help_image_url: field.help_image_url || undefined,
          min_length: field.min_length,
          max_length: field.max_length,
          validation_rules: field.validation_rules,
          options: field.options?.map((option, index) => ({
            id: option.id,
            option_value: option.option_value,
            option_label: option.option_label,
            display_order: index,
            is_active: option.is_active,
            jump_to_section_id: option.jump_to_section_id ? resolveSectionId(option.jump_to_section_id) : undefined
          })) || [],
          grid_options: field.grid_options || { rows: [], columns: [] }
        }))

      return {
        id: section.id,
        title: section.title || '',
        description: section.description || '',
        order: sectionIndex + 1,
        fields: sectionFields,
      }
    })
  }
}


