import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { AppHeader } from '../components/ui/AppHeader';
import { Icon } from '../components/ui/Icon';

interface Command {
  text: string;
  description: string;
}

interface CommandGroup {
  label: string;
  icon: string;
  commands: Command[];
}

const GROUPS: CommandGroup[] = [
  {
    label: 'Adicionar contas',
    icon: 'plus',
    commands: [
      { text: 'aluguel 1500 dia 10', description: 'Conta simples com valor e dia' },
      { text: 'netflix 39.90 mensal', description: 'Assinatura recorrente (12 meses)' },
      { text: 'academia 80 reais todo mês', description: 'Despesa fixa mensal' },
      { text: 'TV 2000 em 10x', description: 'Compra parcelada (total ÷ parcelas)' },
      { text: 'seguro carro 200 por mês em 12 parcelas', description: 'Parcelado (valor por mês)' },
      { text: 'conta de luz 150 vence dia 20', description: 'Conta com vencimento específico' },
    ],
  },
  {
    label: 'Listar e buscar',
    icon: 'list',
    commands: [
      { text: 'listar pendentes', description: 'Contas ainda não pagas' },
      { text: 'listar pagas', description: 'Contas já quitadas' },
      { text: 'contas dessa semana', description: 'Vencimentos nos próximos 7 dias' },
      { text: 'contas atrasadas', description: 'Contas vencidas e não pagas' },
      { text: 'buscar netflix', description: 'Localizar conta pelo nome' },
    ],
  },
  {
    label: 'Pagar contas',
    icon: 'check',
    commands: [
      { text: 'paguei aluguel', description: 'Marca conta como paga' },
      { text: 'quitei a conta de luz', description: 'Outra forma de marcar paga' },
      { text: 'paguei tudo', description: 'Quita todas as pendentes de uma vez' },
    ],
  },
  {
    label: 'Editar e remover',
    icon: 'pencil',
    commands: [
      { text: 'editar aluguel', description: 'Inicia edição — responda com novo valor/data' },
      { text: 'deletar spotify', description: 'Remove a conta definitivamente' },
    ],
  },
  {
    label: 'Resumos',
    icon: 'trend',
    commands: [
      { text: 'resumo do mês', description: 'Balanço do mês atual' },
      { text: 'total de março', description: 'Resumo de mês específico' },
      { text: 'quanto gastei em fevereiro', description: 'Gastos de um mês passado' },
      { text: 'balanço', description: 'Atalho para resumo atual' },
    ],
  },
];

export function ExampleCommandsScreen() {
  const { T } = useAppContext();
  const navigation = useNavigation<any>();

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <AppHeader title="Comandos de exemplo" T={T} left="chevL" onLeft={() => navigation.goBack()}/>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <Text style={{ fontSize: 13, color: T.textDim, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, lineHeight: 19 }}>
          Fale com o assistente de forma natural. Aqui estão exemplos do que você pode dizer:
        </Text>

        {GROUPS.map((group) => (
          <View key={group.label} style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4, paddingBottom: 10 }}>
              <Icon name={group.icon} size={14} color={T.accent} stroke={2}/>
              <Text style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' }}>
                {group.label}
              </Text>
            </View>
            <View style={{ backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 18, overflow: 'hidden' }}>
              {group.commands.map((cmd, i) => (
                <View
                  key={cmd.text}
                  style={{
                    paddingHorizontal: 20, paddingVertical: 14,
                    borderBottomWidth: i < group.commands.length - 1 ? 1 : 0,
                    borderBottomColor: T.border,
                  }}
                >
                  <Text style={{ fontSize: 14, color: T.text, fontWeight: '500', letterSpacing: -0.15, marginBottom: 2 }}>
                    "{cmd.text}"
                  </Text>
                  <Text style={{ fontSize: 12, color: T.textDim }}>
                    {cmd.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
