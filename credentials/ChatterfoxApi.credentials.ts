import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ChatterfoxApi implements ICredentialType {
	name = 'chatterfoxApi';
	icon = 'file:../assets/chatterfox-icon.svg' as const;
	displayName = 'Chatterfox API';
	documentationUrl = 'https://api.chatterfox.co/platform/api/docs#';
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.chatterfox.co/',
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
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/v1/whatsapp/accounts',
			method: 'POST',
			body: {
				apiKey: '={{$credentials.apiKey}}',
			},
		},
	};
}
