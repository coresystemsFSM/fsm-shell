
import { ParameterDefinition } from './parameter-definition.model';

export interface FlowTrigger {
  name: string;
  description: string;
  help: string;
  trigger: string;
  icon: string;
  parameters: ParameterDefinition[];
}