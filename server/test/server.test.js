const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {User} = require('./../models/user');
const {users, addDummyUsers} = require('./seed/seed')

beforeEach(addDummyUsers);

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body._id).toBe(users[0]._id.toHexString());
                expect(res.body.email).toBe(users[0].email);
            })
            .end(done);
    });

    it('should return 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

describe('POST /users', () => {
    it('should create a user', (done) => {
        var email = "ex@emil.com";
        var password = "12345678!";

        request(app)
            .post('/users')
            .send({email, password})
            .expect((res) => {
                expect(res.headers['x-auth']).not.toBeNull();
                expect(res.body._id).not.toBeNull();
                expect(res.body.email).toBe(email);
            })
            .end((err) => {
                if (err) return done(err);

                User.findOne({email}).then((user) => {
                    expect(user).not.toBeNull();
                    expect(user.password).not.toBe(password);
                    done();
                });
            });
    });

    it('should return validation errors if request is invaild', (done) => {
        request(app)
            .post('/users')
            .send({
                email: "someRandomText",
                password: "011001RandomPswd"
            })
            .expect(400)
            .end(done);
    });

    it('should not create user if email in use', (done) => {
        request(app)
            .post('/users')
            .send({
                email: users[0].email,
                password: "12345670"
            })
            .expect(400)
            .end(done);
    });
});


describe('POST /users/login', () => {
    it('Should login user and return auth token', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).not.toBeNull();
            })
            .end((err, res) => {
                if (err) return done(err);

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens[1]).toHaveProperty('access', 'auth');
                    expect(user.tokens[1]).toHaveProperty('token', res.headers['x-auth']);
                    done();
                }).catch((err) => done(err));
            })
    });

    it('Should reject invalid login', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password + '1'
            })
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeUndefined();
            })
            .end((err, res) => {
                if (err) return done(err);

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens.length).toBe(1)
                    done();
                }).catch((err) => done(err));
            })
    });
});

describe('DELETE /users/me/token', () => {
    it('Should remove auth token on logout', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);

                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toBe(0);
                    done()
                }).catch((err) => done(err));
            });
    });
});
