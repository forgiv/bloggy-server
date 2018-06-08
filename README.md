# Bloggy

Bloggy is a centralized blogging platform with posts written in markdown language.

# Bloggy Server

## API

### auth

<b>POST - /api/auth/login</b>

- request: `{ username: String, password: String }`
- response: `{ authToken: String }`

<b>POST - /api/auth/refresh</b>

- request: `{ authToken: String }`
- response: `{ authToken: String }`

### users

<b>POST - /api/users</b>

- request: `{ username: String, password: String, blog: String }`
- response: `{ id: String, username: String, blog: String }`

<b>GET - /api/users/[username]</b>

- response: `{ blog: String }`

<b>GET - /api/users/[username]/posts</b>

- response: `{ [ { title: String, content: String, slug: String, createdAt: DateString, updatedAt: DateString } ] }`

<b>GET - /api/users/[username]/[slug]</b>

- response: `{ title: String, content: String, slug: String, createdAt: DateString, updatedAt: DateString }`

### posts

<b>POST - /api/posts</b>

- request: `{ headers: { authorization: 'Bearer [token]' }, body: { title: String, slug: String, content: String } }`
- response: `{ status: 201, body: { title: String, content: String, slug: String, createdAt: DateString, updatedAt: DateString } }`

### comments

<b>POST - /api/comments</b>

- request: `{ headers: { authorization: 'Bearer [token]' }, body: { content: String, postId: String } }`
- response: `{ status: 201, body: { id: String, content: String, userId: String, postId: String, createdAt: DateString, updatedAt: DateString } }`

<b>GET - /api/comments/[username]/[slug]</b>

- response: `{ [ { id: String, content: String, userId: { username: String }, postId: String, createdAt: DateString, updatedAt: DateString } ] }`

## Tech/framework used

<b>Built with</b>

- [MongoDB](https://www.mongodb.com/)
- [Express](https://expressjs.com/)
- [Node](https://nodejs.org/en/)

## License

MIT © Hiram Cruz 2018
