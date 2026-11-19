CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    group_id INTEGER NOT NULL REFERENCES groups(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    paid_by INTEGER NOT NULL,
    group_id INTEGER NOT NULL,

    CONSTRAINT fk_expense_payer
        FOREIGN KEY (paid_by) REFERENCES users(id),

    CONSTRAINT fk_expense_group
        FOREIGN KEY (group_id) REFERENCES groups(id),

    CONSTRAINT fk_expense_group_member
        FOREIGN KEY (group_id, paid_by)
        REFERENCES group_members (group_id, user_id)
);
