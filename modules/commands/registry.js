/**
 * CareAtlas Slash Command Registry
 *
 * Each command registration provides metadata and the step definitions
 * for the workflow engine. Only /ndis is implemented in Milestone 1.
 * Others are registered as stubs so the architecture is ready.
 */

const COMMAND_REGISTRY = [
  {
    command: '/ndis',
    label: 'NDIS Documentation',
    description: 'Generate NDIS access requests, functional impact reports and supporting letters.',
    module: 'ndis',
    status: 'available',  // available | coming_soon
  },
  {
    command: '/workcover',
    label: 'WorkCover Report',
    description: 'WorkCover reports, specialist referrals and treatment justifications.',
    module: 'workcover',
    status: 'coming_soon',
  },
  {
    command: '/housing',
    label: 'Housing Support',
    description: 'Health-related housing support documentation.',
    module: 'housing',
    status: 'coming_soon',
  },
  {
    command: '/centrelink',
    label: 'Centrelink Documentation',
    description: 'Medical evidence and Centrelink documentation.',
    module: 'centrelink',
    status: 'coming_soon',
  },
  {
    command: '/support letter',
    label: 'Support Letter',
    description: 'General clinical support letters.',
    module: 'support_letter',
    status: 'coming_soon',
  },
  {
    command: '/referral',
    label: 'Referral',
    description: 'Specialist and allied health referrals.',
    module: 'referral',
    status: 'coming_soon',
  },
  {
    command: '/coding',
    label: 'Clinical Coding',
    description: 'Identify uncoded diagnoses and coding inconsistencies.',
    module: 'coding',
    status: 'coming_soon',
  },
  {
    command: '/recall',
    label: 'Recalls',
    description: 'Identify and manage recalls and follow-up tasks.',
    module: 'recall',
    status: 'coming_soon',
  },
];

function findCommand(input) {
  const trimmed = input.trim().toLowerCase();
  return COMMAND_REGISTRY.find(c => c.command === trimmed || trimmed.startsWith(c.command + ' '));
}

function getSuggestions(input) {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed.startsWith('/')) return [];
  return COMMAND_REGISTRY.filter(c => c.command.startsWith(trimmed));
}

if (typeof module !== 'undefined') {
  module.exports = { COMMAND_REGISTRY, findCommand, getSuggestions };
}
