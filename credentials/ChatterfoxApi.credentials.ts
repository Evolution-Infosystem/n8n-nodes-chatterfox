import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ChatterfoxApi implements ICredentialType {
	name = 'chatterfoxApi';
	icon = 'file:../../assets/chatterfox-icon.svg' as const;
	displayName = 'Chatterfox API';
	documentationUrl = 'https://docs.chatterfox.co';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://staging-be.chatterfox.co',
			placeholder: 'https://api.chatterfox.co/',
			description: 'Chatterfox API base URL (default: staging; use https://api.chatterfox.co for production)',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your Chatterfox API key (create one in Chatterfox dashboard)',
		},
	];
}
