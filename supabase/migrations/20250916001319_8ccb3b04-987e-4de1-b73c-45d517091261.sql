-- Create enum types first
CREATE TYPE public.user_role AS ENUM ('attendant', 'manager', 'admin');
CREATE TYPE public.channel_type AS ENUM ('whatsapp', 'email', 'sms', 'webchat');
CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
CREATE TYPE public.conversation_status AS ENUM ('open', 'closed', 'pending');

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'attendant',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    document_number TEXT,
    birth_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channels table
CREATE TABLE public.channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type channel_type NOT NULL,
    configuration JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES public.channels(id) ON DELETE SET NULL,
    subject TEXT,
    status conversation_status DEFAULT 'open',
    priority INTEGER DEFAULT 1,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    status message_status DEFAULT 'sent',
    is_from_patient BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quick_replies table
CREATE TABLE public.quick_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Managers can update all profiles" ON public.profiles
    FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('manager', 'admin'));

CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Create RLS policies for patients
CREATE POLICY "Authenticated users can view patients" ON public.patients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage patients" ON public.patients
    FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for channels
CREATE POLICY "Authenticated users can view channels" ON public.channels
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Managers can manage channels" ON public.channels
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('manager', 'admin'));

-- Create RLS policies for conversations
CREATE POLICY "Users can view assigned conversations" ON public.conversations
    FOR SELECT USING (
        assigned_to = auth.uid() OR 
        public.get_user_role(auth.uid()) IN ('manager', 'admin')
    );

CREATE POLICY "Authenticated users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update assigned conversations" ON public.conversations
    FOR UPDATE USING (
        assigned_to = auth.uid() OR 
        public.get_user_role(auth.uid()) IN ('manager', 'admin')
    );

-- Create RLS policies for messages
CREATE POLICY "Users can view messages from assigned conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id 
            AND (assigned_to = auth.uid() OR public.get_user_role(auth.uid()) IN ('manager', 'admin'))
        )
    );

CREATE POLICY "Authenticated users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for quick_replies
CREATE POLICY "Authenticated users can view quick replies" ON public.quick_replies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage quick replies" ON public.quick_replies
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON public.channels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quick_replies_updated_at
    BEFORE UPDATE ON public.quick_replies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
        'attendant'
    );
    RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Insert default channels
INSERT INTO public.channels (name, type, configuration) VALUES 
    ('WhatsApp Business', 'whatsapp', '{"webhook_url": "", "token": ""}'),
    ('Email Corporativo', 'email', '{"smtp_server": "", "port": 587}'),
    ('SMS Gateway', 'sms', '{"provider": "", "api_key": ""}'),
    ('Chat do Site', 'webchat', '{"widget_color": "#2563eb"}');

-- Insert sample quick replies
INSERT INTO public.quick_replies (title, message, category) VALUES 
    ('Bom dia', 'Bom dia! Como posso ajudá-lo(a) hoje?', 'Saudações'),
    ('Horário de Funcionamento', 'Nosso horário de funcionamento é de segunda a sexta das 8h às 18h, e sábados das 8h às 12h.', 'Informações'),
    ('Agendar Consulta', 'Para agendar sua consulta, preciso de algumas informações. Qual especialidade você procura?', 'Agendamento'),
    ('Documentos Necessários', 'Para sua consulta, traga RG, CPF, cartão do convênio (se houver) e exames anteriores relacionados.', 'Informações'),
    ('Aguarde um momento', 'Por favor, aguarde um momento enquanto verifico essa informação para você.', 'Atendimento');