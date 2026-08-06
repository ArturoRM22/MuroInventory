--
-- PostgreSQL database dump
--

\restrict Pzd0G0q0ugGWpaZVYvs6Ih0kfqetYuAV0zc8TjqOWrxGthbfCrovjQh9fsVND4S

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: movements; Type: TABLE; Schema: public; Owner: arturo
--

CREATE TABLE public.movements (
    id integer NOT NULL,
    day date NOT NULL,
    type text NOT NULL,
    sacks integer NOT NULL,
    tortilleria_id integer NOT NULL,
    employee_name text NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT movements_sacks_check CHECK ((sacks >= 0)),
    CONSTRAINT movements_type_check CHECK ((type = ANY (ARRAY['llegada'::text, 'uso'::text])))
);


ALTER TABLE public.movements OWNER TO arturo;

--
-- Name: movements_id_seq; Type: SEQUENCE; Schema: public; Owner: arturo
--

CREATE SEQUENCE public.movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movements_id_seq OWNER TO arturo;

--
-- Name: movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arturo
--

ALTER SEQUENCE public.movements_id_seq OWNED BY public.movements.id;


--
-- Name: tortillerias; Type: TABLE; Schema: public; Owner: arturo
--

CREATE TABLE public.tortillerias (
    id integer NOT NULL,
    name text NOT NULL,
    is_main boolean DEFAULT false NOT NULL,
    main_tortilleria_id integer,
    initial_stock integer DEFAULT 0 NOT NULL,
    CONSTRAINT no_self_main CHECK ((is_main OR (main_tortilleria_id IS NOT NULL)))
);


ALTER TABLE public.tortillerias OWNER TO arturo;

--
-- Name: tortillerias_id_seq; Type: SEQUENCE; Schema: public; Owner: arturo
--

CREATE SEQUENCE public.tortillerias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tortillerias_id_seq OWNER TO arturo;

--
-- Name: tortillerias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arturo
--

ALTER SEQUENCE public.tortillerias_id_seq OWNED BY public.tortillerias.id;


--
-- Name: user_tortillerias; Type: TABLE; Schema: public; Owner: arturo
--

CREATE TABLE public.user_tortillerias (
    user_id integer NOT NULL,
    tortilleria_id integer NOT NULL
);


ALTER TABLE public.user_tortillerias OWNER TO arturo;

--
-- Name: users; Type: TABLE; Schema: public; Owner: arturo
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'user'::text])))
);


ALTER TABLE public.users OWNER TO arturo;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: arturo
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO arturo;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: arturo
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: movements id; Type: DEFAULT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.movements ALTER COLUMN id SET DEFAULT nextval('public.movements_id_seq'::regclass);


--
-- Name: tortillerias id; Type: DEFAULT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.tortillerias ALTER COLUMN id SET DEFAULT nextval('public.tortillerias_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: movements; Type: TABLE DATA; Schema: public; Owner: arturo
--

COPY public.movements (id, day, type, sacks, tortilleria_id, employee_name, created_by, created_at) FROM stdin;
1	2026-07-31	llegada	10	1	Israel	1	2026-07-31 15:27:20.694966-06
2	2026-07-31	uso	5	1	Israel	1	2026-07-31 15:27:32.926054-06
3	2026-07-29	llegada	3	1	Juan	1	2026-07-31 15:32:29.333584-06
4	2026-07-30	uso	5	1	Juan	1	2026-07-31 15:32:46.338114-06
5	2026-07-30	llegada	20	1	Juan	1	2026-07-31 15:32:56.314109-06
6	2026-07-28	llegada	50	1	Juan	1	2026-07-31 15:34:25.589598-06
7	2026-07-28	uso	5	1	Juan	1	2026-07-31 15:34:36.614763-06
8	2026-07-31	uso	1	1	Guera	1	2026-07-31 15:58:36.898382-06
9	2026-07-28	uso	5	1	Guera	1	2026-07-31 15:59:47.66371-06
10	2026-07-31	llegada	2	1	Guera	1	2026-07-31 16:20:25.757241-06
11	2026-08-05	llegada	20	1	Guera	1	2026-08-05 15:43:15.70372-06
12	2026-08-05	uso	5	1	Israel	1	2026-08-05 15:43:23.398507-06
13	2026-08-06	uso	1	1	Guera	1	2026-08-05 18:37:59.521421-06
14	2026-08-06	llegada	10	1	Israel	1	2026-08-05 18:38:14.811634-06
15	2026-08-05	llegada	1	1	Guera	1	2026-08-05 18:39:28.270454-06
16	2026-08-06	llegada	1	1	Guera	3	2026-08-05 18:58:08.712782-06
17	2026-08-06	uso	5	1	Israel	3	2026-08-05 18:58:23.787892-06
18	2026-08-05	llegada	3	1	Guera	3	2026-08-05 18:59:56.545594-06
19	2026-08-05	uso	2	1	Guera	3	2026-08-05 19:11:41.439512-06
\.


--
-- Data for Name: tortillerias; Type: TABLE DATA; Schema: public; Owner: arturo
--

COPY public.tortillerias (id, name, is_main, main_tortilleria_id, initial_stock) FROM stdin;
1	Torre	t	\N	50
\.


--
-- Data for Name: user_tortillerias; Type: TABLE DATA; Schema: public; Owner: arturo
--

COPY public.user_tortillerias (user_id, tortilleria_id) FROM stdin;
1	1
4	1
2	1
3	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: arturo
--

COPY public.users (id, name, password, role) FROM stdin;
1	admin	$2b$12$tSr41nO0cK7Gt.quS/XpFui/ZdUrvR3WqO2bsgvvML6VPm24gR9CS	admin
2	usuarioTorre	$2b$10$UxbnwNNObwA5QvSAqT99euy2W4FANF1QPtUT0gwfAaoiWBMMR7IBy	user
3	ARTURO	$2b$10$YvvYxnZtsjXTKNlVTjJQ9uzR9B6B1NKsMX8/QT6m2ecYX0vbi5HIe	admin
4	usuarioPerla	$2b$10$ijL6L5e2NmJ9U5Wjl7gSDeNvjVmA9QM1y4/c9MYe0mudbXLzOUS0a	user
\.


--
-- Name: movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arturo
--

SELECT pg_catalog.setval('public.movements_id_seq', 19, true);


--
-- Name: tortillerias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arturo
--

SELECT pg_catalog.setval('public.tortillerias_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: arturo
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: movements movements_pkey; Type: CONSTRAINT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_pkey PRIMARY KEY (id);


--
-- Name: tortillerias tortillerias_pkey; Type: CONSTRAINT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.tortillerias
    ADD CONSTRAINT tortillerias_pkey PRIMARY KEY (id);


--
-- Name: user_tortillerias user_tortillerias_pkey; Type: CONSTRAINT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.user_tortillerias
    ADD CONSTRAINT user_tortillerias_pkey PRIMARY KEY (user_id, tortilleria_id);


--
-- Name: users users_name_key; Type: CONSTRAINT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_name_key UNIQUE (name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_movements_tort_day; Type: INDEX; Schema: public; Owner: arturo
--

CREATE INDEX idx_movements_tort_day ON public.movements USING btree (tortilleria_id, day);


--
-- Name: idx_user_tortillerias_tortilleria; Type: INDEX; Schema: public; Owner: arturo
--

CREATE INDEX idx_user_tortillerias_tortilleria ON public.user_tortillerias USING btree (tortilleria_id);


--
-- Name: movements movements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: movements movements_tortilleria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_tortilleria_id_fkey FOREIGN KEY (tortilleria_id) REFERENCES public.tortillerias(id);


--
-- Name: tortillerias tortillerias_main_tortilleria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.tortillerias
    ADD CONSTRAINT tortillerias_main_tortilleria_id_fkey FOREIGN KEY (main_tortilleria_id) REFERENCES public.tortillerias(id) ON DELETE SET NULL;


--
-- Name: user_tortillerias user_tortillerias_tortilleria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.user_tortillerias
    ADD CONSTRAINT user_tortillerias_tortilleria_id_fkey FOREIGN KEY (tortilleria_id) REFERENCES public.tortillerias(id) ON DELETE CASCADE;


--
-- Name: user_tortillerias user_tortillerias_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: arturo
--

ALTER TABLE ONLY public.user_tortillerias
    ADD CONSTRAINT user_tortillerias_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Pzd0G0q0ugGWpaZVYvs6Ih0kfqetYuAV0zc8TjqOWrxGthbfCrovjQh9fsVND4S

