import request from '@/axios.js'


export function getUserInfo () {
    return request({
        url: `/user`,
        method: 'get'
    })
}