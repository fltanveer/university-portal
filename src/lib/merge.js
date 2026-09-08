import { currency, formatDate } from './format';
import { MERGE_FIELDS } from '../data/mockData';

export { MERGE_FIELDS };

/**
 * Resolves {{tokens}} against a real applicant. Unknown or unresolvable tokens
 * are left visibly marked rather than silently blanked, so staff can see what
 * would go out wrong before it does.
 */
export function resolveMergeFields(text, ctx) {
  if (!text) return '';
  const { applicant, course, intake, university, officer, scholarship, deadline } = ctx;

  const map = {
    '{{student_name}}': applicant?.name,
    '{{first_name}}': applicant?.firstName,
    '{{course}}': course?.title,
    '{{intake}}': intake?.label,
    '{{university}}': university?.name,
    '{{reference}}': applicant?.reference,
    '{{deadline}}': deadline ? formatDate(deadline) : formatDate(new Date(Date.now() + 21 * 86400000)),
    '{{tuition}}': course ? `${currency(course.tuition, course.currency)} per year` : null,
    '{{conditions}}': applicant?.offerConditions,
    '{{officer_name}}': officer?.name,
    '{{scholarship_name}}': scholarship?.name,
    '{{scholarship_amount}}':
      scholarship != null
        ? scholarship.type === 'percentage'
          ? `${scholarship.value}% of tuition`
          : currency(scholarship.value, scholarship.currency)
        : null,
  };

  return text.replace(/\{\{[a-z_]+\}\}/g, (token) => {
    const value = map[token];
    return value == null || value === '' ? `[${token.replace(/[{}]/g, '')} — not available]` : value;
  });
}

export function findUnresolved(text) {
  return [...new Set((text.match(/\[[a-z_]+ — not available\]/g) || []))];
}
