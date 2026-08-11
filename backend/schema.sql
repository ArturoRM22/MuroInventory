--
-- PostgreSQL database dump
--

\restrict jSbfIopqlFBBHeaN1socpKYMCQwCVycOXLzXei9eS0v2HR1ewhY9cVwIAMRHpwk

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
-- Name: movements; Type: TABLE; Schema: public; Owner: -
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
    destination_tortilleria_id integer,
    transfer_group uuid,
    CONSTRAINT movements_sacks_check CHECK ((sacks >= 0)),
    CONSTRAINT movements_type_check CHECK ((type = ANY (ARRAY['llegada'::text, 'uso'::text, 'salida'::text])))
);


--
-- Name: movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movements_id_seq OWNED BY public.movements.id;


--
-- Name: tortillerias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tortillerias (
    id integer NOT NULL,
    name text NOT NULL,
    is_main boolean DEFAULT false NOT NULL,
    main_tortilleria_id integer,
    initial_stock integer DEFAULT 0 NOT NULL,
    CONSTRAINT no_self_main CHECK ((is_main OR (main_tortilleria_id IS NOT NULL)))
);


--
-- Name: tortillerias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tortillerias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tortillerias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tortillerias_id_seq OWNED BY public.tortillerias.id;


--
-- Name: user_tortillerias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_tortillerias (
    user_id integer NOT NULL,
    tortilleria_id integer NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    password text NOT NULL,
    role text NOT NULL,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'user'::text, 'super'::text])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: movements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements ALTER COLUMN id SET DEFAULT nextval('public.movements_id_seq'::regclass);


--
-- Name: tortillerias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tortillerias ALTER COLUMN id SET DEFAULT nextval('public.tortillerias_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: movements movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_pkey PRIMARY KEY (id);


--
-- Name: tortillerias tortillerias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tortillerias
    ADD CONSTRAINT tortillerias_pkey PRIMARY KEY (id);


--
-- Name: user_tortillerias user_tortillerias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tortillerias
    ADD CONSTRAINT user_tortillerias_pkey PRIMARY KEY (user_id, tortilleria_id);


--
-- Name: users users_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_name_key UNIQUE (name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_movements_destination; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_destination ON public.movements USING btree (destination_tortilleria_id);


--
-- Name: idx_movements_tort_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_movements_tort_day ON public.movements USING btree (tortilleria_id, day);


--
-- Name: idx_user_tortillerias_tortilleria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tortillerias_tortilleria ON public.user_tortillerias USING btree (tortilleria_id);


--
-- Name: movements movements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: movements movements_destination_tortilleria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_destination_tortilleria_id_fkey FOREIGN KEY (destination_tortilleria_id) REFERENCES public.tortillerias(id);


--
-- Name: movements movements_tortilleria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_tortilleria_id_fkey FOREIGN KEY (tortilleria_id) REFERENCES public.tortillerias(id);


--
-- Name: tortillerias tortillerias_main_tortilleria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tortillerias
    ADD CONSTRAINT tortillerias_main_tortilleria_id_fkey FOREIGN KEY (main_tortilleria_id) REFERENCES public.tortillerias(id) ON DELETE SET NULL;


--
-- Name: user_tortillerias user_tortillerias_tortilleria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tortillerias
    ADD CONSTRAINT user_tortillerias_tortilleria_id_fkey FOREIGN KEY (tortilleria_id) REFERENCES public.tortillerias(id) ON DELETE CASCADE;


--
-- Name: user_tortillerias user_tortillerias_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tortillerias
    ADD CONSTRAINT user_tortillerias_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict jSbfIopqlFBBHeaN1socpKYMCQwCVycOXLzXei9eS0v2HR1ewhY9cVwIAMRHpwk

