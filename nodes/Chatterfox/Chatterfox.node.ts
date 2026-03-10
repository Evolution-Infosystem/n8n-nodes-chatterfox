import {
	type IDataObject,
	type IExecuteFunctions,
	type ILoadOptionsFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

const DEFAULT_BASE_URL = 'https://api.chatterfox.co/';

export class Chatterfox implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Chatterfox',
		name: 'chatterfox',
		icon: 'file:../../assets/chatterfox-icon.svg' as const,
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Send WhatsApp messages via Chatterfox',
		defaults: {
			name: 'Chatterfox',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'chatterfoxApi',
				required: true,
				testedBy: 'getAccounts',
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a WhatsApp message to a phone number',
						action: 'Send a whats app message',
					},
				],
				default: 'sendMessage',
			},
			{
				displayName: 'WhatsApp Account Name or ID',
				name: 'accountId',
				type: 'options',
				required: true,
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getAccounts',
				},
				default: '',
			},
			{
				displayName: 'Country Code Name or ID',
				name: 'countryCode',
				type: 'options',
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getCountries',
				},
			},
			{
				displayName: 'Phone Number',
				name: 'phoneNumber',
				type: 'string',
				default: '',
				placeholder: '1234567890',
				description: "Recipient's phone number without country code (e.g. 8141943231). Combined with Country Code to form the full number.",
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'The text content of the message. Supports n8n expressions for dynamic content: e.g. from AI Agent use {{ $JSON.output }} or {{ $node["AI Agent"].JSON.output }}, from email use {{ $JSON.text }} or {{ $JSON.body }}. If sending files, this appears as the caption. Supports JSON.',
				placeholder: 'e.g. {{ $json.output }} or type your message',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
			},
			{
				displayName: 'File Attachment Mode',
				name: 'fileMode',
				type: 'options',
				default: 'none',
				description: 'Choose how to attach files to this message',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				options: [
					{
						name: 'No Files',
						value: 'none',
						description: 'Send text message only',
					},
					{
						name: 'Binary (From Previous Node)',
						value: 'binary',
						description: 'Attach binary files from a previous node (e.g. email attachments). No extra upload service needed.',
					},
					{
						name: 'File URLs',
						value: 'urls',
						description: 'Attach files by providing public HTTPS URLs',
					},
				],
			},
			{
				displayName: 'Binary Property Names',
				name: 'binaryProperties',
				type: 'string',
				default: '',
				placeholder: 'attachment_0, attachment_1 (leave empty to attach ALL)',
				description: 'Comma-separated list of binary property names from the previous node. Leave completely empty to automatically attach every file (perfect for email attachments).',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						fileMode: ['binary'],
					},
				},
			},
			{
				displayName: 'File URLs',
				name: 'files',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add File URL',
				},
				default: [],
				placeholder: 'https://example.com/file.pdf',
				description:
					'Public file URLs to attach. Up to 10 files, max 50MB each. Supported: images (JPEG, PNG, GIF, WebP), documents (PDF, DOC, DOCX, XLS, XLSX, TXT), videos (MP4, AVI, MOV), audio (MP3, WAV).',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
						fileMode: ['urls'],
					},
				},
			},
			{
				displayName: 'Scheduled Time',
				name: 'scheduledTime',
				type: 'dateTime',
				typeOptions: {
					defaultValue: 'now',
				},
				default: '',
				description:
					'Optional. Date and time to send the message in ISO 8601 format (UTC), e.g. 2026-03-01T10:30:00Z. Leave empty to send immediately.',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
			},
			{
				displayName: 'Timezone Name or ID',
				name: 'timezoneId',
				type: 'options',
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				typeOptions: {
					loadOptionsMethod: 'getTimezones',
				},
			},
			{
				displayName: 'Disappearing Message',
				name: 'expiration',
				type: 'options',
				default: '',
				description: 'Optional. Set when this message will automatically disappear.',
				displayOptions: {
					show: {
						operation: ['sendMessage'],
					},
				},
				options: [
					{ name: 'No Expiration', value: '' },
					{ name: '24 Hours', value: 1 },
					{ name: '7 Days', value: 2 },
					{ name: '90 Days', value: 3 },
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getAccounts(this: ILoadOptionsFunctions) {
				try {
					const creds = await this.getCredentials('chatterfoxApi');
					const apiKey = creds.apiKey as string;
					const base =
						(creds.baseUrl as string)?.trim()?.replace(/\/$/, '') || DEFAULT_BASE_URL.replace(/\/$/, '');
					const res = await this.helpers.httpRequest({
						method: 'POST',
						url: `${base}/api/v1/whatsapp/accounts`,
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							apiKey: apiKey,
							page: 1,
							limit: 100,
							search: '',
							activeOnly: false,
						}),
					});
					const data = (res as { data?: { id: string; name: string; phoneNumber: string; status: string }[] }).data || [];
					return data.map((a) => ({ name: `${a.name} (${a.phoneNumber})${a.status === 'connected' ? ' - Active' : ' - Inactive'}`, value: a.id }));
				} catch {
					return [];
				}
			},
			async getTimezones(this: ILoadOptionsFunctions) {
				try {
					const creds = await this.getCredentials('chatterfoxApi');
					const base =
						(creds.baseUrl as string)?.trim()?.replace(/\/$/, '') || DEFAULT_BASE_URL.replace(/\/$/, '');
					const res = await this.helpers.httpRequest({
						method: 'GET',
						url: `${base}/timezones`,
						json: true,
					});
					const data = (res as { data?: { name: string; utc?: string; offset?: string }[] }).data || [];
					return data.map((t) => ({ name: `${t.name} (${t.utc ?? t.offset ?? ''})`, value: t.name }));
				} catch {
					return [];
				}
			},
			async getCountries(this: ILoadOptionsFunctions) {
				try {
					const creds = await this.getCredentials('chatterfoxApi');
					const base =
						(creds.baseUrl as string)?.trim()?.replace(/\/$/, '') || DEFAULT_BASE_URL.replace(/\/$/, '');
					const res = await this.helpers.httpRequest({
						method: 'GET',
						url: `${base}/countries`,
						json: true,
					});
					const data = (res as { data?: { name: string; dialCode: string }[] }).data || [];
					return data.map((c) => ({ name: `${c.name} (${c.dialCode})`, value: c.dialCode }));
				} catch {
					return [];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('chatterfoxApi');
		const apiKey = credentials.apiKey as string;
		const accountId = this.getNodeParameter('accountId', 0) as string;
		let baseUrl =
			(credentials.baseUrl as string)?.trim() || DEFAULT_BASE_URL.replace(/\/$/, '');
		baseUrl = baseUrl.replace(/\/$/, '');

		if (operation === 'sendMessage') {
			for (let i = 0; i < items.length; i++) {
				try {
					const countryCode = (this.getNodeParameter('countryCode', i) as string) || '';
					const phoneNumber = (this.getNodeParameter('phoneNumber', i) as string) || '';
					const to = (countryCode.trim() + phoneNumber.replace(/^\s*\+/, '').trim()).trim();
					const message = this.getNodeParameter('message', i) as string;
					const fileMode = this.getNodeParameter('fileMode', i, 'none') as string;
					// const scheduledTime = this.getNodeParameter('scheduledTime', i, '') as string;
					const scheduledTimeRaw = this.getNodeParameter('scheduledTime', i, '') as string | number;
					const scheduledTime =
						typeof scheduledTimeRaw === 'number'
							? new Date(scheduledTimeRaw).toISOString()
							: (scheduledTimeRaw ?? '').trim();
					const timezoneId = this.getNodeParameter('timezoneId', i, '') as string;
					const expiration = this.getNodeParameter('expiration', i, '') as number | string;

					if (!to) {
						throw new NodeOperationError(this.getNode(), 'Country Code and Phone Number are required', { itemIndex: i });
					}
					if (!message.trim()) {
						throw new NodeOperationError(this.getNode(), 'Message is required', { itemIndex: i });
					}

					const toFormatted = to.startsWith('+') ? to : `+${to}`;

					// ----------------------------------------------------------------
					// BINARY MODE — multipart/form-data with real file buffers
					// ----------------------------------------------------------------
					if (fileMode === 'binary') {
						const binaryPropsRaw = (this.getNodeParameter('binaryProperties', i, '') as string).trim();
						let binaryPropNames: string[];
						if (binaryPropsRaw) {
							binaryPropNames = binaryPropsRaw.split(',').map((p) => p.trim()).filter(Boolean);
						} else {
							binaryPropNames = Object.keys(items[i].binary || {});
						}
						// const binaryPropNames = binaryPropsRaw.split(',').map((p) => p.trim()).filter(Boolean);
						if (binaryPropNames.length === 0) {
							throw new NodeOperationError(this.getNode(), 'No binary files found to attach', { itemIndex: i });
						}
						// const binaryPropertyName = this.getNodeParameter('binaryProperties', i, '') as string;
						// console.log('Available binary properties:', Object.keys(items[i].binary || {}));
						// const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						// const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						// const blob = new Blob([buffer], { type: binaryData.mimeType });
						// Use n8n's helper to construct the multipart body correctly
						const formData = new FormData();
						formData.append('apiKey', apiKey);
						formData.append('accountId', accountId);
						formData.append('to', toFormatted);
						formData.append('message', message.trim());
						formData.append('scheduledTime', scheduledTime?.trim());
						formData.append('timezoneId', timezoneId?.trim());
						formData.append('expiration', String(expiration));

						// Skip items that have no binary data at all
						if (!items[i].binary || Object.keys(items[i].binary || {}).length === 0) {
							continue; // skip this item entirely
						}
  
						for (const propName of binaryPropNames) {
							try {
							  const binaryData = this.helpers.assertBinaryData(i, propName);
							  const buffer = await this.helpers.getBinaryDataBuffer(i, propName);
						
							  // Important: use correct filename & mime type
							  formData.append(
								'files',                            // ← field name your API expects
								new Blob([buffer], { type: binaryData.mimeType }),
								binaryData.fileName || `file-${propName}`
							  );
							} catch {
								// Skip missing binary property
							}
						}
						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/api/v1/send-message`,
							headers: {
								'x-api-key': apiKey,
								// Authorization header if required by your API
								'Authorization': `Bearer ${apiKey}`,

							},
							body: formData,
						});
					
						const rd = response as { data?: { messageId?: string }; message?: string };
						returnData.push({ 
							json: { success: true, messageId: rd.data?.messageId, message: rd.message }, 
							pairedItem: { item: i } 
						});
					} else {
						// ----------------------------------------------------------------
						// JSON MODE — URL list or no files
						// ----------------------------------------------------------------
						const body: IDataObject = { apiKey, accountId, to: toFormatted, message: message.trim() };

						if (fileMode === 'urls') {
							const filesParam = this.getNodeParameter('files', i, []) as string[] | string;
							let fileList: string[] = [];
							if (Array.isArray(filesParam)) {
								fileList = filesParam.filter((u) => typeof u === 'string' && u.trim()) as string[];
							} else if (typeof filesParam === 'string' && filesParam.trim()) {
								fileList = [filesParam.trim()];
							} else if (filesParam && typeof filesParam === 'object' && 'values' in filesParam && Array.isArray((filesParam as { values: unknown[] }).values)) {
								fileList = (filesParam as { values: { value?: string }[] }).values.map((v) => (v && typeof v === 'object' && typeof v.value === 'string' ? v.value.trim() : '')).filter(Boolean);
							}
							if (fileList.length > 0) body.files = fileList;
						}

						// if (scheduledTime?.trim()) body.scheduledTime = scheduledTime.trim();
						if (scheduledTime) body.scheduledTime = scheduledTime;
						if (timezoneId?.trim()) body.timezoneId = timezoneId.trim();
						if (expiration !== '' && expiration !== undefined && String(expiration).trim() !== '') body.expiration = Number(expiration);

						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/api/v1/send-message`,
							headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` },
							body,
							json: true,
						});

						const rd = response as { success?: boolean; message?: string; data?: { messageId?: string; result?: unknown }; error?: string };
						if (!rd.success) {
							throw new NodeOperationError(this.getNode(), rd.message || rd.error || 'Failed to send message', { itemIndex: i });
						}
						returnData.push({ json: { success: true, messageId: rd.data?.messageId, result: rd.data?.result, message: rd.message } as IDataObject, pairedItem: { item: i } });
					}

				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({ json: { success: false, error: error instanceof Error ? error.message : String(error) } as IDataObject, pairedItem: { item: i } });
					} else {
						if (error instanceof NodeOperationError) throw error;
						const err = error as { response?: { status?: number; data?: unknown }; message?: string };
						const status = err.response?.status;
						const data = err.response?.data;
						let serverMessage: string;
						const dataStr = typeof data === 'string' ? data : '';
						const msgStr = err.message || '';
						const isHtmlBlockPage =
							(dataStr && (dataStr.trimStart().startsWith('<!DOCTYPE') || dataStr.trimStart().startsWith('<html') || dataStr.includes('Web Filter Violation') || dataStr.includes('FortiGuard') || dataStr.includes('Access Blocked'))) ||
							(msgStr.includes('Web Filter Violation') || msgStr.includes('FortiGuard'));
						if (isHtmlBlockPage) {
							serverMessage = 'Your network blocked the request (e.g. FortiGuard / Proxy Avoidance). Try: (1) Set Base URL to https://api.chatterfox.co/ or https://api.chatterfox.co, or (2) Use another network.';
						} else if (data && typeof data === 'object' && 'message' in data) {
							serverMessage = (data as { message?: string }).message || err.message || 'Request failed';
						} else if (data && typeof data === 'object' && 'error' in data) {
							serverMessage = (data as { error?: string }).error || err.message || 'Request failed';
						} else if (typeof data === 'string') {
							serverMessage = data || err.message || 'Request failed';
						} else if (data && typeof data === 'object') {
							serverMessage = JSON.stringify(data);
						} else {
							serverMessage = err.message || 'Request failed';
						}
						const hint = status === 403 && !isHtmlBlockPage ? ' — Check: API Key and Account ID are correct, Base URL matches your Chatterfox backend, and the key has send permissions.' : '';
						throw new NodeOperationError(this.getNode(), serverMessage + hint, { itemIndex: i });
					}
				}
			}
		}

		return [returnData];
	}
}