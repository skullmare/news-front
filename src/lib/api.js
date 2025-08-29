import axios from 'axios'

// Получаем token из URL и сохраняем
const urlParams = new URLSearchParams(window.location.search);
const bearerToken = urlParams.get('bearer');

let AUTH = null;

if (bearerToken) {
	AUTH = `Bearer ${bearerToken}`;
	// Сохраняем в sessionStorage (переживает перезагрузку в рамках одной вкладки)
	sessionStorage.setItem('authToken', AUTH);
} else {
	// Пытаемся взять из sessionStorage если уже сохраняли
	AUTH = sessionStorage.getItem('authToken');
}

const api = axios.create({
	baseURL: 'https://n8n-shkuratetskiyav.amvera.io',
	headers: {
		Authorization: AUTH,
	},
})

function toFormData(obj) {
	const fd = new FormData()
	Object.entries(obj || {}).forEach(([key, value]) => {
		if (value !== undefined && value !== null) {
			fd.append(key, value)
		}
	})
	return fd
}

export const NewsAPI = {
	listNews: async () => {
		const { data } = await api.get('/webhook/news')
		return data
	},
	getPost: async (id) => {
		const { data } = await api.post('/webhook/new', toFormData({ id }))
		return Array.isArray(data) ? data[0] : data
	},
	generatePostTitle: async (title) => {
		const { data } = await api.post('/webhook/new/gen/title', toFormData({ title }))
		return data
	},
	generatePostText: async (text) => {
		const { data } = await api.post('/webhook/new/gen/text', toFormData({ text }))
		return data
	},
	generatePhoto: async (prompt) => {
		const { data } = await api.post('/webhook/new/photo/gen', toFormData({ prompt }))
		return data
	},
	reGeneratePhoto: async (id, prompt) => {
		const { data } = await api.post('/webhook/new/photo/peregen', toFormData({ id, prompt }))
		return data
	},
	deletePostImage: async (id) => {
		const { data } = await api.post('/webhook/new/photo/del', toFormData({ id }))
		return data
	},
	publishPost: async (id) => {
		const { data } = await api.post('/webhook/new/pub', toFormData({ id }))
		return data
	},
	addPost: async (title, text, link) => {
		const { data } = await api.post('/webhook/new/add', toFormData({ title, text, link }), {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		})
		return data
	},
	uploadPhotoToPost: async ({ id, img }) => {
		const fd = new FormData()
		if (id !== undefined && id !== null) fd.append('id', id)
		if (img) fd.append('img', img)
		const { data } = await api.post('/webhook/new/photo/add', fd)
		return data
	},
	updatePost: async ({ id, title, text, link }) => {
		const { data } = await api.put('/webhook/new/update', toFormData({ id, title, text, link }))
		return data
	},
	deletePost: async (id) => {
		const { data } = await api.delete('/webhook/new/delete', { data: toFormData({ id }) })
		return data
	},
	reGeneratePostTitle: async ({ id, title }) => {
		const { data } = await api.post('/webhook/new/peregen/title', toFormData({ id, title }))
		return data
	},
	reGeneratePostText: async ({ id, text }) => {
		const { data } = await api.post('/webhook/new/peregen/text', toFormData({ id, text }))
		return data
	},
}

export const SettingsAPI = {
	getSettings: async () => {
		const { data } = await api.get('/webhook/settings')
		return Array.isArray(data) ? data[0] : data
	},
	setPrompt: async (prompt) => {
		const { data } = await api.post('/webhook/settings/edit/prompt', toFormData({ prompt }))
		return data
	},
	setPromptTitle: async (prompt_title) => {
		const { data } = await api.post('/webhook/settings/edit/prompt/title', toFormData({ prompt_title }))
		return data
	},
	setPromptText: async (prompt_text) => {
		const { data } = await api.post('/webhook/settings/edit/prompt/text', toFormData({ prompt_text }))
		return data
	},
	setPromptImg: async (prompt_img) => {
		const { data } = await api.post('/webhook/settings/edit/prompt/img', toFormData({ prompt_img }))
		return data
	},

	setCountNews: async (count_news) => {
		const { data } = await api.post('/webhook/settings/edit/count_news', toFormData({ count_news }))
		return data
	},
	setCountNewsParsing: async (count_news_parsing) => {
		const { data } = await api.post('/webhook/settings/edit/count_news_parsing', toFormData({ count_news_parsing }))
		return data
	},
}

export const ChannelsAPI = {
	list: async () => {
		const { data } = await api.get('/webhook/channels')
		return data
	},
	add: async ({ url }) => {
		const { data } = await api.post('/webhook/channel/add', toFormData({ url }))
		return data
	},
	remove: async (id) => {
		const { data } = await api.delete('/webhook/channel/delete', { data: toFormData({ id }) })
		return data
	},
} 