const MAX_LEN = 5

export function generate(): string {
    let id = ""
    const subset = "123456789qwertyuiopasdfghjklzxcvbnm"
    for (let i = 0; i < MAX_LEN; i++) {
        id += subset[Math.floor(Math.random() * subset.length)]
    }
    return id
}