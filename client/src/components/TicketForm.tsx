import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface TicketFormProps {
  availableSkills: string[];
}

// Form validation schema
const ticketFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(5, { message: "Please provide a detailed description" }),
  skills: z.array(z.string()).min(1, { message: "Select at least one required skill" }),
  deadline: z.string().min(1, { message: "Deadline is required" }),
  priority: z.enum(["low", "medium", "high"]),
  assignedTo: z.string(),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

export default function TicketForm({ availableSkills }: TicketFormProps) {
  const { toast } = useToast();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Get team members for dropdown
  const { data: teamMembers = [] } = useQuery<any[]>({
    queryKey: ['/api/team-members'],
  });

  // Set up form with validation
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      title: "",
      description: "",
      skills: [],
      deadline: "",
      priority: "medium",
      assignedTo: "auto",
    },
  });

  // Create ticket mutation
  const createTicket = useMutation({
    mutationFn: async (values: TicketFormValues) => {
      // Convert assignedTo to number if provided, handle auto-assign
      const payload = {
        ...values,
        assignedTo: values.assignedTo && values.assignedTo !== "auto" ? 
          parseInt(values.assignedTo) : undefined,
      };
      
      const response = await apiRequest('POST', '/api/tickets', payload);
      return response.json();
    },
    onSuccess: () => {
      // Reset form and show success message
      form.reset({
        title: "",
        description: "",
        skills: [],
        deadline: "",
        priority: "medium",
        assignedTo: "auto",
      });
      setSelectedSkills([]);
      
      // Invalidate queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      
      toast({
        title: "Ticket Created",
        description: "Your ticket has been successfully created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Creating Ticket",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: TicketFormValues) => {
    createTicket.mutate(values);
  };

  // Handle skill checkbox changes
  const handleSkillChange = (skill: string, checked: boolean) => {
    if (checked) {
      const newSkills = [...selectedSkills, skill];
      setSelectedSkills(newSkills);
      form.setValue('skills', newSkills);
    } else {
      const newSkills = selectedSkills.filter(s => s !== skill);
      setSelectedSkills(newSkills);
      form.setValue('skills', newSkills);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Ticket</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title Input */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Ticket Title <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter ticket title" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Description Input */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Description <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the task in detail" 
                    rows={4} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Required Skills */}
          <FormField
            control={form.control}
            name="skills"
            render={() => (
              <FormItem>
                <FormLabel>
                  Required Skills <span className="text-red-500">*</span>
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map(skill => (
                    <div 
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      <Checkbox
                        id={`skill-${skill.toLowerCase()}`}
                        checked={selectedSkills.includes(skill)}
                        onCheckedChange={(checked) => 
                          handleSkillChange(skill, checked as boolean)
                        }
                        className="mr-1"
                      />
                      <label htmlFor={`skill-${skill.toLowerCase()}`}>{skill}</label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.skills && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {form.formState.errors.skills.message}
                  </p>
                )}
              </FormItem>
            )}
          />
          
          {/* Deadline Input */}
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Deadline <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Team Member Assignment */}
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Assign to Team Member (Optional)
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto-assign based on skills" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="auto">Auto-assign based on skills</SelectItem>
                    {teamMembers.map((member: any) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name} ({member.skills.join(", ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Priority Selection */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="priority-low" />
                      <label htmlFor="priority-low" className="text-sm text-gray-700">
                        Low
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="priority-medium" />
                      <label htmlFor="priority-medium" className="text-sm text-gray-700">
                        Medium
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="priority-high" />
                      <label htmlFor="priority-high" className="text-sm text-gray-700">
                        High
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full"
              disabled={createTicket.isPending}
            >
              {createTicket.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
